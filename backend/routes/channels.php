<?php

declare(strict_types=1);
use Illuminate\Support\Facades\Broadcast;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Illuminate\Support\Facades\Log;

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {

    Log::info("ĐÃ VÀO KÊNH THÀNH CÔNG! User ID: " . $user->id);
    try {
        $conversation = Chat::conversations()->getById($conversationId);
        if (!$conversation) {
            return false;
        }

        $participants = $conversation->getParticipants();
        return $participants->contains(function ($participant) use ($user) {
            return $participant->id === $user->id;
        });
    } catch (\Exception $e) {
        return false;
    }
}, ['guards' => ['api']]);
