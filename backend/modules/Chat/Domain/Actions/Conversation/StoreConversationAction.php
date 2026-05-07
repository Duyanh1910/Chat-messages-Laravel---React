<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Conversation;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Conversation\StoreConversationRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Conversation;

final class StoreConversationAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(StoreConversationRequest $request): JsonResponse
    {
        $conversation = $this->handle(
            (int) Auth::id(),
            (array) $request->validated('participants'),
        );

        return self::ok($conversation, 'Tạo hội thoại thành công', 201);
    }

    /**
     * @return Conversation
     *
     * @throws Exception
     */
    public function handle(int $creatorId, array $participantIds)
    {
        $allIds = array_unique(array_merge([$creatorId], $participantIds));

        $usersArray = User::query()
            ->whereIn('id', $allIds)
            ->get()
            ->all();

        if (count($usersArray) < 2) {
            throw new Exception('Cần ít nhất 2 người dùng để tạo hội thoại.', 400);
        }

        $conversation = Chat::createConversation($usersArray);

        $conversation->load('participants.messageable');

        return $conversation;
    }
}
