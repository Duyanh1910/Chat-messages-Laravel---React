<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Auth\Register as AuthRegister;
use Modules\Chat\Register as ChatRegister;
use Illuminate\Support\Facades\Broadcast;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var class-string<IModuleProvider>[]
     */
    public static array $registerClasses = [
        AuthRegister::class,
        ChatRegister::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        foreach (self::$registerClasses as $class) {
            $this->app->singleton($class, fn () => new $class($this->app));
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $publicRoutes = [];
        $protectedRoutes = [];

        Broadcast::routes([
            'middleware' => ['auth:api'],
        ]);

        if (file_exists(base_path('routes/channels.php'))) {
            require base_path('routes/channels.php');
        }

        foreach (self::$registerClasses as $class) {
            $register = app($class);
            $register->boot();
            $register->registerPolicies();
            $this->loadMigrationsFrom($register->getMigrationPath());
            if ($class === AuthRegister::class) {
                $publicRoutes[] = $register->getRoutePath();
            } else {
                $protectedRoutes[] = $register->getRoutePath();
            }
        }

        Route::prefix('api')
            ->middleware([])
            ->group(function () use ($publicRoutes) {
                foreach ($publicRoutes as $path) {
                    require $path;
                }
            });

        Route::prefix('api')
            ->middleware(['auth:api'])
            ->group(function () use ($protectedRoutes) {
                foreach ($protectedRoutes as $path) {
                    require $path;
                }
            });
    }
}
