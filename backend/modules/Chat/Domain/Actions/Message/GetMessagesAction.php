<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Message;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Message\GetMessagesRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;

final class GetMessagesAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(GetMessagesRequest $request): JsonResponse
    {
        $messages = $this->handle(
            (int) Auth::id(),
            (int) $request->validated('conversation_id'),
            $request->validated('cursor'),
            (int) $request->input('per_page', 25)
        );

        return self::ok($messages, 'Lấy danh sách tin nhắn thành công');
    }

    public function handle(int $userId, int $conversationId, ?string $cursor = null, int $perPage = 25)
    {
        $user = User::query()->findOrFail($userId);

        $conversation = Chat::conversations()->getById($conversationId);

        if (! $conversation) {
            throw new Exception('Cuộc hội thoại không tồn tại.', 404);
        }

        $messages = Chat::conversation($conversation)
            ->setParticipant($user)
            ->setCursorPaginationParams([
                'perPage' => $perPage,
                'sorting' => 'desc',
                'cursor' => $cursor,
            ])
            ->getMessagesWithCursor();

        return $messages;
    }
}
