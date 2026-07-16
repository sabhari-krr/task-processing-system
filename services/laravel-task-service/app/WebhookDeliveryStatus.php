<?php

namespace App;

enum WebhookDeliveryStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Acknowledged = 'acknowledged';
    case Failed = 'failed';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => $next === self::Sent,
            self::Sent => in_array($next, [self::Acknowledged, self::Failed], true),
            self::Acknowledged, self::Failed => false,
        };
    }
}
