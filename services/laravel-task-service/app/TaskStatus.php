<?php

namespace App;

enum TaskStatus: string
{
    case Pending = 'pending';
    case Dispatched = 'dispatched';
    case DeliveryFailed = 'delivery_failed';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Dispatched, self::DeliveryFailed], true),
            self::Dispatched, self::DeliveryFailed => false,
        };
    }
}
