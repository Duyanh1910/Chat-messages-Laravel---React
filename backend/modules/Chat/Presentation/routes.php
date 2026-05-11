<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Chat\Domain\Actions\Attachment\DownloadAttachmentAction;
use Modules\Chat\Domain\Actions\Attachment\UploadAttachmentAction;
use Modules\Chat\Domain\Actions\Conversation\StoreConversationAction;
use Modules\Chat\Domain\Actions\Message\GetMessagesAction;
use Modules\Chat\Domain\Actions\Message\SendMessagesAction;
use Modules\Chat\Domain\Actions\Reaction\ReactMessagesAction;
use Modules\Chat\Domain\Actions\Conversation\GetConversationsAction;

Route::group([], function () {
    Route::prefix('v1/chat')
        ->middleware('auth:api')
        ->name('chat.')->group(function () {
            Route::post('messages/upload', UploadAttachmentAction::class)->name('message-upload');
            Route::post('messages/{messageId}/download', DownloadAttachmentAction::class)->name('message-download');
            Route::post('messages', SendMessagesAction::class)->name('send-message');
            Route::get('messages', GetMessagesAction::class)->name('get-message');
            Route::post('messages/{messageId}/reactions', ReactMessagesAction::class)->name('message-reactions');

            Route::post('conversations', StoreConversationAction::class)->name('store-conversation');
            Route::get('conversations', GetConversationsAction::class)->name('get-conversations');
        });
});
