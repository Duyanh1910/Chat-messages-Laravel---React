<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Conversation;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreConversationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'participants' => ['required', 'array', 'min:2'],
            'participants.*' => [
                'integer',
                Rule::exists(User::class, 'id'),
            ],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
