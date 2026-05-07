<?php

declare(strict_types=1);

namespace App\Concerns;

use ArithmeticError;
use Carbon\Carbon;
use Error;
use ErrorException;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;
use Lorisleiva\Actions\Concerns\AsAction;
use PDOException;
use Throwable;

trait HasApiResponse
{
    public static function exception(Throwable $exception, ?string $message = null, ?string $domainCode = null): JsonResponse
    {
        if ($exception instanceof ModelNotFoundException) {
            $shouldExpose = self::shouldExposeException($exception);
            $responseMessage = $message ?? self::makeModelNotFoundMessage($exception);

            return response()->json([
                'success' => false,
                'message' => $responseMessage,
                'data' => null,
                'exception' => $shouldExpose ? self::formatExceptionPayload($exception) : null,
                'domain_code' => $domainCode,
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $isValidationException = $exception instanceof ValidationException;
        $shouldExpose = self::shouldExposeException($exception);
        $responseMessage = $shouldExpose ? ($message ?? $exception->getMessage()) : 'Lỗi bất định';

        return response()->json([
            'success' => false,
            'message' => $responseMessage,
            'data' => null,
            'exception' => $shouldExpose ? self::formatExceptionPayload($exception) : null,
            'domain_code' => $domainCode,
        ], $isValidationException ? 422 : 500, [], JSON_UNESCAPED_UNICODE);
    }

    public function buildResponseData(Request $request, Builder $builder): array
    {
        if (! $request->filled('page') || ! $request->filled('pageSize')) {
            return ['data' => $builder->get(), 'pagination' => null];
        }
        $pageSize = $request->integer('pageSize', 10);
        $pageSize = max(1, min($pageSize, 100000));
        $page = $request->integer('page', 1);
        $page = max(1, min($page, 10000));
        $numberOfSkipRecords = ($page - 1) * $pageSize;
        $total = $builder->toBase()->getCountForPagination();
        $items = $builder->offset($numberOfSkipRecords)->limit($pageSize)->get();
        $totalPages = (int) ceil($total / $pageSize);

        return [
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $total,
                'totalPages' => $totalPages,
            ],
        ];
    }

    public function buildResponseFromArray(Request $request, array $data): array
    {
        $collection = collect($data);
        $sorts = $request->get('sorts', []);
        if (is_array($sorts) && ! empty($sorts)) {
            // Áp dụng sort theo thứ tự ưu tiên
            $collection = $collection->sort(function ($a, $b) use ($sorts) {
                foreach ($sorts as $sort) {
                    $field = $sort['field'] ?? null;
                    $order = $sort['order'] ?? 'ascend';

                    if (! $field || ! isset($a[$field], $b[$field])) {
                        continue;
                    }

                    $valueA = $a[$field];
                    $valueB = $b[$field];
                    $dateA = self::parseDate($valueA);
                    $dateB = self::parseDate($valueB);
                    // 🕒 Nếu là chuỗi ngày thì ép sang Carbon để so sánh chính xác
                    if ($dateA && $dateB) {
                        $valueA = $dateA->timestamp;
                        $valueB = $dateB->timestamp;
                    }

                    // Nếu 2 giá trị khác nhau, trả kết quả so sánh
                    if ($valueA !== $valueB) {
                        if ($order === 'descend') {
                            return $valueA < $valueB ? 1 : -1;
                        }

                        return $valueA > $valueB ? 1 : -1;
                    }
                }

                return 0; // tất cả đều bằng nhau
            });
        }
        if (! $request->filled('page') || ! $request->filled('pageSize')) {
            return ['data' => $collection->values(), 'pagination' => null];
        }

        $pageSize = $request->integer('pageSize', 10);
        $page = $request->integer('page', 1);
        $total = $collection->count();
        $items = $collection->forPage($page, $pageSize)->values();

        return [
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $total,
                'totalPages' => ceil($total / $pageSize),
            ],
        ];
    }

    protected static function ok(mixed $data = [], string $message = '', int $status = 200, ?string $domainCode = null): JsonResponse
    {
        return new JsonResponse([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'domain_code' => $domainCode,
        ], $status, [], JSON_UNESCAPED_UNICODE);
    }

    protected static function error(mixed $data = [], string $message = 'failed', int $status = 200, ?string $domainCode = null): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'message' => $message,
            'data' => $data,
            'domain_code' => $domainCode,
        ], $status, [], JSON_UNESCAPED_UNICODE);
    }

    protected static function shouldExposeException(Throwable $exception): bool
    {
        if (App::isLocal()) {
            return true;
        }
        // Hide all database/PDO exceptions FIRST (highest priority)
        if ($exception instanceof QueryException || $exception instanceof PDOException) {
            return false;
        }

        // Hide all Errors (TypeError, ParseError, etc.)
        if ($exception instanceof Error) {
            return false;
        }

        // Hide all Arithmetic Errors (DivisionByZeroError, etc.)
        if ($exception instanceof ArithmeticError) {
            return false;
        }

        if ($exception instanceof ErrorException) {
            return false;
        }

        // Hide all Laravel framework exceptions
        if (self::isLaravelException($exception)) {
            return false;
        }

        // Only expose ValidationException
        if ($exception instanceof ValidationException) {
            return true;
        }

        // Only expose LogicException
        if ($exception instanceof LogicException) {
            return true;
        }

        // Only expose exceptions from Domain/Actions (but not database/framework exceptions)
        if ($exception instanceof Exception && self::isRaisedFromAction($exception)) {
            return true;
        }

        // Default: hide everything else
        return false;
    }

    protected static function isLaravelException(Throwable $exception): bool
    {
        $exceptionClass = $exception::class;

        // Check if exception is from Illuminate namespace
        if (str_starts_with($exceptionClass, 'Illuminate\\')) {
            return true;
        }

        // Check if exception is from Symfony namespace (used by Laravel)
        if (str_starts_with($exceptionClass, 'Symfony\\')) {
            return true;
        }

        return false;
    }

    protected static function isRaisedFromAction(Throwable $exception): bool
    {
        $file = $exception->getFile();
        if ($file !== '' && str_contains($file, DIRECTORY_SEPARATOR.'Domain'.DIRECTORY_SEPARATOR.'Actions'.DIRECTORY_SEPARATOR)) {
            return true;
        }

        foreach ($exception->getTrace() as $frame) {
            if (! isset($frame['class'])) {
                continue;
            }

            $class = (string) $frame['class'];

            if (! class_exists($class)) {
                continue;
            }

            $traits = class_uses($class);

            if ($traits !== false && in_array(AsAction::class, $traits, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    protected static function formatExceptionPayload(Throwable $exception): array
    {
        return [
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTrace(),
        ];
    }

    private static function makeModelNotFoundMessage(ModelNotFoundException $exception): string
    {
        $modelClass = $exception->getModel();

        if (! is_string($modelClass) || $modelClass === '') {
            return 'Không tìm thấy thông tin yêu cầu';
        }

        /** @var Model $modelInstance */
        $modelInstance = new $modelClass;

        $table = $modelInstance->getTable();
        $translationKey = "table.$table";

        if (Lang::has($translationKey)) {
            $tableName = Lang::get($translationKey);
        } elseif (Lang::has($translationKey, 'vi')) {
            $tableName = Lang::get($translationKey, [], 'vi');
        } else {
            $tableName = Str::headline(class_basename($modelClass));
        }

        $ids = array_filter(array_map('strval', Arr::wrap($exception->getIds())));
        $identifier = implode(', ', $ids);
        $resource = Str::lower($tableName);

        if ($identifier === '') {
            return "Không tìm thấy thông tin {$resource}";
        }

        return "Không tìm thấy thông tin {$resource} với mã '{$identifier}'";
    }

    private static function parseDate($value): ?Carbon
    {
        if (! is_string($value)) {
            return null;
        }
        $formats = [
            'Y-m-d H:i:s',
            'Y-m-d',
            'd/m/Y H:i:s',
            'd/m/Y',
            'd-m-Y H:i:s',
            'd-m-Y',
        ];
        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $value);
            } catch (Exception $e) {
                continue;
            }
        }

        return null;
    }

    private static function isDateString($value): bool
    {
        return self::parseDate($value) !== null;
    }
}
