# Status Flow

## Purpose

This document defines the status transitions for version 1 of the task-processing microservices project.

The system has two backend services:

- Laravel Task Service
- Python Processing Service

Each service owns its own states.
States must not be mixed between services.

## Design Rules

- Status transitions must be explicit.
- Invalid transitions should be rejected in code.
- Producer-side and consumer-side states are separate.
- Terminal states should not be changed without a deliberate retry or replay flow.
- State changes should be stored together with timestamps.

## 1. Laravel Task Status Flow

This status represents Laravel’s view of the task lifecycle.

### Status values

- `pending`
- `dispatched`
- `delivery_failed`

### Meaning

- `pending` = task exists in Laravel and webhook has not been successfully acknowledged yet.
- `dispatched` = webhook was accepted by Python.
- `delivery_failed` = Laravel could not successfully deliver the webhook.

### Allowed transitions

- `pending` -> `dispatched`
- `pending` -> `delivery_failed`

### Not allowed

- `dispatched` -> `pending`
- `delivery_failed` -> `pending` automatically
- `delivery_failed` -> `dispatched` without a retry action

### Notes

- A task starts as `pending` when created.
- Laravel changes the task to `dispatched` only after Python acknowledges the webhook.
- If Laravel exhausts retry attempts or gets a terminal failure, the task becomes `delivery_failed`.

## 2. Laravel Webhook Delivery Status Flow

This status represents delivery attempt state for the webhook itself.

### Status values

- `pending`
- `sent`
- `acknowledged`
- `failed`

### Meaning

- `pending` = delivery record created but not attempted yet.
- `sent` = a delivery attempt was made.
- `acknowledged` = Python returned a successful response.
- `failed` = delivery failed after an attempt.

### Allowed transitions

- `pending` -> `sent`
- `sent` -> `acknowledged`
- `sent` -> `failed`

### Optional future transitions

- `failed` -> `sent` through retry logic

### Notes

- `acknowledged` means Python accepted the event, not that all downstream processing is complete.
- A failed delivery should record `response_code`, `last_error`, and increment `attempt_count`.

## 3. Python Received Event Status Flow

This status represents Python’s handling of the incoming webhook event.

### Status values

- `received`
- `processing`
- `processed`
- `failed`

### Meaning

- `received` = event was accepted and stored.
- `processing` = event handling has started.
- `processed` = event completed successfully.
- `failed` = event processing failed.

### Allowed transitions

- `received` -> `processing`
- `processing` -> `processed`
- `processing` -> `failed`

### Not allowed

- `processed` -> `processing`
- `processed` -> `received`
- `failed` -> `received` automatically

### Notes

- Python should first validate and deduplicate the event.
- If valid and not duplicate, it stores the raw event and marks it `received`.
- When processing begins, status becomes `processing`.
- After successful local record creation, status becomes `processed`.
- If processing errors occur, status becomes `failed`.

## 4. Python Processed Task Status Flow

This status represents Python’s own local business record created from the event.

### Status values

- `created`
- `completed`
- `failed`

### Meaning

- `created` = local processed-task record was created.
- `completed` = local processing finished successfully.
- `failed` = local processing could not complete.

### Allowed transitions

- `created` -> `completed`
- `created` -> `failed`

### Notes

- In version 1, this can stay simple.
- If processing is very small, `created` and `completed` may happen almost immediately.
- This state exists to show Python owns its own task-like record and lifecycle.

## 5. Duplicate Event Rule

Webhook delivery is at-least-once, so duplicate events must be expected.

### Rule

If Python receives the same `event_id` more than once:

- it must not create a second `received_events` row,
- it must not create a second `processed_tasks` row,
- it should return a success response indicating the duplicate was safely ignored.

### Reason

This ensures idempotent processing and prevents duplicate side effects.

## 6. Failure Handling Rule

Failures must be recorded at the layer where they happen.

### Laravel failure examples

- Python endpoint unreachable
- timeout
- invalid HTTP response
- authentication failure

These affect:
- `webhook_deliveries.status`
- `tasks.status`

### Python failure examples

- invalid payload shape
- processing exception
- database write failure
- duplicate event handling path

These affect:
- `received_events.status`
- `processed_tasks.status`

## 7. Timestamp Guidance

Each stateful record should store timestamps that help explain the lifecycle.

### Laravel

- `created_at`
- `updated_at`
- `last_attempt_at`

### Python

- `received_at`
- `processed_at`
- `created_at`
- `updated_at`

These timestamps help debugging, observability, and later retry or replay features.

## 8. Version 1 Summary

Version 1 has four separate state views:

- Laravel task status
- Laravel webhook delivery status
- Python received event status
- Python processed task status

Each exists for a different reason and should be updated only by the service that owns it.
