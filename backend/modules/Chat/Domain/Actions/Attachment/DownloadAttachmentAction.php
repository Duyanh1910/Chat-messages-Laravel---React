<?php

declare(strict_types=1);

namespace Modules\Chat\Domain\Actions\Attachment;

use App\Concerns\HasApiResponse;
use Exception;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\Concerns\AsAction;
use Modules\Chat\Presentation\Requests\Attachment\DownloadAttachmentRequest;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Message;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class DownloadAttachmentAction
{
    use AsAction;
    use HasApiResponse;

    public function asController(DownloadAttachmentRequest $request, int $messageId): Response|StreamedResponse|BinaryFileResponse
    {
        return $this->handle(
            (int) Auth::id(),
            $messageId
        );

    }

    /**
     * @return BinaryFileResponse|StreamedResponse
     *
     * @throws Exception
     */
    public function handle(int $userId, int $messageId)
    {

        $message = Message::query()->findOrFail($messageId);

        $conversation = Chat::conversations()->getById($message->conversation_id);

        $isParticipant = $conversation->participants->contains('messageable_id', $userId);

        if (! $isParticipant) {
            throw new Exception('Bạn không có quyền truy cập.', 403);
        }

        $data = $message->data;
        if (empty($data['file_path'])) {
            throw new Exception('Không thấy tệp đính kèm.', 403);
        }
        $filePath = $data['file_path'];
        $originalName = $data['original_name'];

        $disk = Storage::disk('private');

        if (! $disk->exists($filePath)) {
            throw new Exception('Không thấy tệp đính kèm trên máy chủ.', 404);
        }

        return $disk->download($filePath, $originalName);
    }
}
