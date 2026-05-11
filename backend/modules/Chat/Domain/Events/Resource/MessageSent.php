<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Events\Resource;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Musonza\Chat\Models\Message;
use Modules\Chat\Domain\DTOs\MessageDTO;

final class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $connection = 'reverb';
    public function __construct(
        public readonly MessageDTO $message
    ) {

    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('conversation.' . $this->message->conversationId);
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return $this->message->toArray();
    }
}
