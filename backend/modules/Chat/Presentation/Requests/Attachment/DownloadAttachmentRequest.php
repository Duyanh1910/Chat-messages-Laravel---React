<?php

declare(strict_types=1);

namespace Modules\Chat\Presentation\Requests\Attachment;

use Illuminate\Foundation\Http\FormRequest;

final class DownloadAttachmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
