<?php

declare(strict_types=1);

namespace App\Providers;

interface IModuleProvider
{
    public function getMigrationPath(): string;

    public function getRoutePath(): string;

    public function seed(): void;

    public function registerPolicies(): void;

    public function boot(): void;
}
