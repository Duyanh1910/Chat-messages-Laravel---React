<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

final class GetMessagesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'integer'],
            'cursor' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
