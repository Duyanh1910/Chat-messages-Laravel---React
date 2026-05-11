<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\DTOs;

use Musonza\Chat\Models\Message;

final readonly class MessageDTO
{
    public function __construct(
        public int $id,
        public int $conversationId,
        public int $senderId,
        public string $body,
        public string $type,
        public string $createdAt,
        public array $data = [],
        public ?array $sender = null
    ) {
    }

    public static function fromModel(Message $message): self
    {
        return new self(
            id: $message->id,
            conversationId: $message->conversation_id,
            senderId: $message->messageable_id ?? $message->sender?->id,
            body: $message->body,
            type: $message->type,
            createdAt: $message->created_at->toISOString(),
            data: $message->data ?? [],
            sender: $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
            ] : null,
        );
    }

    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
