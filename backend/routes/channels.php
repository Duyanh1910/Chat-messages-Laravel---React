<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel(
    'conversation.{conversationId}',
    function ($user, $conversationId) {
        Log::info("🚀 ĐÃ VÀO KÊNH THÀNH CÔNG! User: {$user->name} | ID: {$user->id} đang xin vào phòng: {$conversationId}");

        // Tạm thời cho phép tất cả
        return true;
        // return DB::table('mc_participants')
        //     ->where('conversation_id', $conversationId)
        //     ->where('messageable_id', $user->id)
        //     ->exists();
    }
);
