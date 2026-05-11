<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Attachment;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Attachment\UploadAttachmentRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;

final class UploadAttachmentAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(UploadAttachmentRequest $request): JsonResponse
    {
        $conversation = $this->handle(
            (int) Auth::id(),
            (int) $request->validated('conversation_id'),
            $request->file('files'),
            (string) $request->validated('body'),
        );

        return self::ok($conversation, 'Gửi tin nhắn thành công', 201);
    }

    /**
     * @return array $messages
     *
     * @throws Exception
     */
    public function handle(int $userId, int $conversationId, array $files, ?string $body = null)
    {
        $user = User::query()->findOrFail($userId);

        $conversation = Chat::conversations()->getById($conversationId);

        if (! $conversation) {
            throw new Exception('Cuộc hội thoại không tồn tại.', 404);
        }
        $type = 'text';
        $data = [];
        $messages = [];

        $messageBody = empty($body) ? "Đã gửi tệp đính kèm" : $body;

        foreach ($files as $file) {
            $path = $file->store('messages_files', 'private');
            $mimeType = $file->getMimeType();
            $type = str_starts_with($mimeType, 'image/') ? 'image' : 'file';
            $data = [
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $mimeType,
            ];
            $message = Chat::message($messageBody)
                ->type($type)
                ->data($data)
                ->from($user)
                ->to($conversation)
                ->send();
            $messages[] = $message;
        }

        return $messages;
    }
}
