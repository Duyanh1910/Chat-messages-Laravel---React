<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
                    'name' => 'Price Jakubowski',
                    'email' => 'khachhang@gmail.com',
                    'password' => bcrypt('password'),
                ]);

        User::factory()->create([
            'name' => 'Tito Ankunding II',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
        ]);
    }
}
