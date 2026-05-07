<?php

declare(strict_types=1);

namespace Modules\Auth\Domain\Actions;

use App\Concerns\HasApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Auth\Presentation\Requests\LoginRequest;

final class LoginAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(LoginRequest $request): JsonResponse
    {
        $data = $this->handle(
            (string) $request->validated('login_id'),
            (string) $request->validated('password'),
        );

        return self::ok($data, 'Đăng nhập thành công');
    }

    public function handle(string $loginId, string $password)
    {
        if (! Auth::attempt([
            'email' => $loginId,
            'password' => $password,
        ])) {
            throw ValidationException::withMessages([
                'username' => ['Sai tên đăng nhập hoặc mật khẩu!'],
            ]);
        }
        $user = User::select(
            'id',
            'name',
            'email',
        )->findOrFail(Auth::id());
        $token = $user->createToken('auth_token')->accessToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ];
    }
}
