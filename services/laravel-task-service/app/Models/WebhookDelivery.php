<?php

namespace App\Models;

use App\WebhookDeliveryStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $fillable = [
        'task_id',
        'event_id',
        'event_type',
        'target_url',
        'payload',
        'status',
        'attempt_count',
        'last_attempt_at',
        'response_code',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'status' => WebhookDeliveryStatus::class,
            'last_attempt_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function transitionTo(WebhookDeliveryStatus $status): void
    {
        if (! $this->status->canTransitionTo($status)) {
            throw new \RuntimeException("Invalid webhook delivery status transition: {$this->status->value} -> {$status->value}");
        }

        $this->update(['status' => $status]);
    }
}
