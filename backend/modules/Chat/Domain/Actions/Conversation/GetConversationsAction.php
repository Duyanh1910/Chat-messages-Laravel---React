<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Conversation;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Lorisleiva\Actions\Concerns\AsAction;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Conversation;

final class GetConversationsAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(): JsonResponse
    {
        $conversation = $this->handle(
            (int) Auth::id(),
        );

        return self::ok($conversation, 'Lấy danh sách hội thoại thành công', 201);
    }

    /**
     * @return Conversation
     *
     * @throws Exception
     */
    public function handle(int $userId)
    {
        $user = User::query()->findOrFail($userId);

        return Chat::conversations()->setParticipant($user)->get();
    }
}
