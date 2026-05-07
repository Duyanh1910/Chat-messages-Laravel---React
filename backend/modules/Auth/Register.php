<?php

declare(strict_types=1);

namespace Modules\Auth;

use App\Providers\IModuleProvider;
use Illuminate\Support\ServiceProvider;

final class Register extends ServiceProvider implements IModuleProvider
{
    public function seed(): void {}

    public function getRoutePath(): string
    {
        return __DIR__.'/Presentation/routes.php';
    }

    public function getMigrationPath(): string
    {
        return __DIR__.'/Infrastructure/Migrations';
    }

    public function registerPolicies(): void {}

    public function boot(): void {}
}
