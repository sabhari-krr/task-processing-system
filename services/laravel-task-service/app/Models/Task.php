<?php

namespace App\Models;

use App\TaskStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
        ];
    }

    public function webhookDeliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    public function transitionTo(TaskStatus $status): void
    {
        if (! $this->status->canTransitionTo($status)) {
            throw new \RuntimeException("Invalid task status transition: {$this->status->value} -> {$status->value}");
        }

        $this->update(['status' => $status]);
    }
}
