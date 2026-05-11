<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Musonza\Chat\Facades\ChatFacade as Chat;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user1 = User::factory()->create([
                    'name' => 'Price Jakubowski',
                    'email' => 'khachhang@gmail.com',
                    'password' => bcrypt('password'),
                ]);

        $user2 = User::factory()->create([
            'name' => 'Tito Ankunding II',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
        ]);

        Chat::createConversation([$user1,$user2]);
    }
}
