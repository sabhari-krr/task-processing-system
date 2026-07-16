<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Resources\TaskResource;
use App\Jobs\DispatchTaskWebhookJob;
use App\Models\Task;
use App\Models\WebhookDelivery;
use App\TaskStatus;
use App\WebhookDeliveryStatus;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    public function index()
    {
        return TaskResource::collection(Task::latest()->get());
    }

    public function store(StoreTaskRequest $request)
    {
        $task = Task::create([
            ...$request->validated(),
            'status' => TaskStatus::Pending,
        ]);

        $eventId = 'evt_'.Str::uuid();

        $delivery = WebhookDelivery::create([
            'task_id' => $task->id,
            'event_id' => $eventId,
            'event_type' => 'task.created',
            'target_url' => config('services.python_webhook.url'),
            'payload' => [
                'event_id' => $eventId,
                'event_type' => 'task.created',
                'occurred_at' => now()->utc()->format('Y-m-d\TH:i:s\Z'),
                'data' => [
                    'task_id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                ],
            ],
            'status' => WebhookDeliveryStatus::Pending,
        ]);

        DispatchTaskWebhookJob::dispatch($delivery->id);

        return TaskResource::make($task)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Task $task)
    {
        return TaskResource::make($task);
    }
}
