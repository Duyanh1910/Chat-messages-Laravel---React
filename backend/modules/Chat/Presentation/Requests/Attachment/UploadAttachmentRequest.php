<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Attachment;

use Illuminate\Foundation\Http\FormRequest;

final class UploadAttachmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'conversation_id' => [
                'required',
                'integer',
            ],
            'body' => [
                'nullable',
                'string',
            ],
            'files' => [
                'required',
                'array',
                'min:1',
            ],
            'files.*' => [
                'file',
                'mimes:jpg,jpeg,png,docx,pdf,xlsx,txt,doc,mp4,avi,mp3',
                'max:10240',
            ],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
