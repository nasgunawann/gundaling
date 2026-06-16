<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('kitchen-orders', function ($user) {
    return in_array($user->role, ['Chef', 'Manager']);
});

Broadcast::channel('waiter-floor', function ($user) {
    return in_array($user->role, ['Server', 'Manager']);
});
