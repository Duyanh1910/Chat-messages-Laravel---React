<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Auth\Domain\Actions\LoginAction;

Route::group([], function () {
    Route::prefix('v1/auth')
        ->name('auth.')->group(function () {
            Route::post('login', LoginAction::class)->name('login');
        });
});
