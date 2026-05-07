<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Reaction;

use Illuminate\Foundation\Http\FormRequest;

final class ReactMessagesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'reaction' => [
                'required',
                'string',
                'max:50',
            ],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
