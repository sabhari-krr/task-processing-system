<?php

namespace App\Jobs;

use App\Models\WebhookDelivery;
use App\TaskStatus;
use App\WebhookDeliveryStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;

class DispatchTaskWebhookJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $webhookDeliveryId,
    ) {}

    public function handle(): void
    {
        $delivery = WebhookDelivery::findOrFail($this->webhookDeliveryId);
        $task = $delivery->task;

        $body = json_encode($delivery->payload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac('sha256', $body, config('services.python_webhook.secret'));

        $delivery->attempt_count++;
        $delivery->last_attempt_at = now();
        $delivery->transitionTo(WebhookDeliveryStatus::Sent);

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Event-Type' => $delivery->event_type,
                    'X-Event-ID' => $delivery->event_id,
                    'X-Webhook-Version' => '1',
                    'X-Webhook-Signature' => $signature,
                ])
                ->withBody($body, 'application/json')
                ->post($delivery->target_url);

            if ($response->successful()) {
                $delivery->response_code = $response->status();
                $delivery->transitionTo(WebhookDeliveryStatus::Acknowledged);
                $task->transitionTo(TaskStatus::Dispatched);

                return;
            }

            $delivery->response_code = $response->status();
            $delivery->last_error = str($response->body())->limit(1000)->value();
        } catch (\Throwable $e) {
            $delivery->last_error = str($e->getMessage())->limit(1000)->value();
        }

        $delivery->transitionTo(WebhookDeliveryStatus::Failed);
        $task->transitionTo(TaskStatus::DeliveryFailed);
    }
}
