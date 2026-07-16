# API Contract

## Purpose

This document defines the API and webhook contract for version 1 of the task-processing system.

The system has:
- React frontend
- Laravel Task Service
- Python Processing Service

React talks only to Laravel.
Laravel sends webhooks to Python.
Python processes the event and stores its own records.

## Version 1 Scope

Version 1 supports:
- creating a task,
- listing tasks,
- viewing a task,
- sending a `task.created` webhook,
- receiving and storing the webhook in Python,
- processing the event once.

Version 1 does not include:
- Notion integration,
- email sending,
- PDF generation,
- Slack posting,
- third-party action execution.

## Laravel Public API

### POST /api/tasks

Creates a new task.

#### Request body

```json
{
  "title": "Write weekly report",
  "description": "Prepare the engineering summary for this week"
}
```

#### Validation rules

- `title`: required, string, max 255
- `description`: nullable, string

#### Success response

Status: `201 Created`

```json
{
  "id": 1,
  "title": "Write weekly report",
  "description": "Prepare the engineering summary for this week",
  "status": "pending",
  "created_at": "2026-07-16T14:30:00Z"
}
```

### GET /api/tasks

Returns all tasks.

#### Success response

Status: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Write weekly report",
    "description": "Prepare the engineering summary for this week",
    "status": "pending",
    "created_at": "2026-07-16T14:30:00Z"
  }
]
```

### GET /api/tasks/{id}

Returns a single task.

#### Success response

Status: `200 OK`

```json
{
  "id": 1,
  "title": "Write weekly report",
  "description": "Prepare the engineering summary for this week",
  "status": "pending",
  "created_at": "2026-07-16T14:30:00Z"
}
```

#### Not found response

Status: `404 Not Found`

```json
{
  "message": "Task not found"
}
```

## Laravel -> Python Webhook

### POST /webhooks/tasks

This endpoint is exposed by the Python Processing Service.

Laravel sends a webhook when a task is created.

### Webhook headers

Laravel sends these headers:

- `Content-Type: application/json`
- `X-Event-Type: task.created`
- `X-Event-ID: evt_001`
- `X-Webhook-Version: 1`
- `X-Webhook-Signature: <signature-or-shared-secret-value>`

### Webhook payload

```json
{
  "event_id": "evt_001",
  "event_type": "task.created",
  "occurred_at": "2026-07-16T14:30:00Z",
  "data": {
    "task_id": 1,
    "title": "Write weekly report",
    "description": "Prepare the engineering summary for this week"
  }
}
```

## Webhook validation rules

Python must validate:

- `event_id`: required, unique for deduplication
- `event_type`: required, must be `task.created`
- `occurred_at`: required, valid ISO 8601 timestamp
- `data.task_id`: required
- `data.title`: required
- `data.description`: optional

Python must verify the webhook signature or shared secret before processing.

Python must store the raw payload before or during processing.

## Webhook response rules

### Accepted

Status: `202 Accepted`

```json
{
  "message": "Webhook accepted"
}
```

Use this when:
- signature is valid,
- payload is valid,
- event is accepted for processing.

### Duplicate event

Status: `200 OK`

```json
{
  "message": "Duplicate event ignored"
}
```

Use this when:
- `event_id` was already received before.

### Invalid signature

Status: `401 Unauthorized`

```json
{
  "message": "Invalid signature"
}
```

### Invalid payload

Status: `422 Unprocessable Entity`

```json
{
  "message": "Invalid payload",
  "errors": {
    "event_type": [
      "The event_type field is required."
    ]
  }
}
```

### Server error

Status: `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

## Status values

Laravel task status values for version 1:

- `pending`
- `dispatched`
- `delivery_failed`

Python event status values for version 1:

- `received`
- `processing`
- `processed`
- `failed`

## Contract rules

- React must not call Python directly.
- Laravel must not read Python database directly.
- Python must not read Laravel database directly.
- `event_id` must be used for idempotency.
- Webhook payload version must be explicit.
- Raw webhook payload should be stored for debugging and replay support later.
