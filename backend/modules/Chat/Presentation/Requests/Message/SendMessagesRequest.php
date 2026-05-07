<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

final class SendMessagesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'integer'],
            'body' => ['required', 'string'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
