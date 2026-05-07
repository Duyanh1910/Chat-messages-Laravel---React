<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Reaction;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Reaction\ReactMessagesRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Message;

final class ReactMessagesAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(ReactMessagesRequest $request, int $messageId): JsonResponse
    {
        $result = $this->handle(
            (int) Auth::id(),
            (string) $request->validated('reaction'),
            $messageId
        );

        return self::ok($result, 'Cập nhật biểu cảm thành công', 201);
    }

    public function handle(int $userId, string $reaction, int $messageId)
    {
        $user = User::findOrFail($userId);
        $message = Message::findOrFail($messageId);

        $result = Chat::message($message)
            ->setParticipant($user)
            ->toggleReaction($reaction);

        return [
            'result' => $result,
            'reaction' => $reaction,
            'summary' => $message->getReactionsSummary(),
        ];
    }
}
