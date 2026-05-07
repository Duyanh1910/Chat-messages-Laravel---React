<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Message;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Message\SendMessagesRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Message;

final class SendMessagesAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(SendMessagesRequest $request): JsonResponse
    {
        $message = $this->handle(
            (int) Auth::id(),
            (int) $request->validated('conversation_id'),
            (string) $request->validated('body')
        );

        return self::ok($message, 'Gửi tin nhắn thành công', 201);
    }

    /**
     * @return Message
     *
     * @throws Exception
     */
    public function handle(int $senderId, int $conversationId, string $body)
    {
        $sender = User::query()->find($senderId);

        if (! $sender) {
            throw new Exception('Người dùng không tồn tại.', 404);
        }

        $conversation = Chat::conversations()->getById($conversationId);

        if (! $conversation) {
            throw new Exception('Cuộc hội thoại không tồn tại.', 404);
        }

        $message = Chat::message($body)
            ->from($sender)
            ->to($conversation)
            ->send();

        return $message;
    }
}
