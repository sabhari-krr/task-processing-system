# Database Design

## Purpose

This document defines the database design for version 1 of the task-processing microservices project.

The system contains two backend services:

- Laravel Task Service
- Python Processing Service

Each backend service owns its own database and must not directly read or write the other service’s database.

## Design Principles

- Each service owns its own data.
- Data is exchanged only through APIs and webhooks.
- Webhook events must be stored durably.
- Duplicate events must not be processed twice.
- Status transitions must be explicit.
- Version 1 should stay small and avoid premature tables.

## Laravel Database

Laravel is responsible for:
- task creation,
- storing tasks,
- tracking outbound webhook delivery attempts.

### Table: tasks

Stores the user-created tasks.

#### Columns

- `id` - bigint, primary key
- `title` - string, required
- `description` - text, nullable
- `status` - string, required
- `created_at` - timestamp
- `updated_at` - timestamp

#### Status values

- `pending`
- `dispatched`
- `delivery_failed`

#### Notes

- `status` represents Laravel’s view of task delivery state.
- This is not Python processing state.
- A task is created first in Laravel before the webhook is sent.

### Table: webhook_deliveries

Stores outbound webhook delivery attempts from Laravel to Python.

#### Columns

- `id` - bigint, primary key
- `task_id` - foreign key to `tasks.id`
- `event_id` - string, required, unique
- `event_type` - string, required
- `target_url` - string, required
- `payload` - json, required
- `status` - string, required
- `attempt_count` - integer, default 0
- `last_attempt_at` - timestamp, nullable
- `response_code` - integer, nullable
- `last_error` - text, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

#### Status values

- `pending`
- `sent`
- `acknowledged`
- `failed`

#### Notes

- `event_id` must be unique.
- `payload` stores the exact webhook body sent to Python.
- `attempt_count` is incremented on each delivery attempt.
- `response_code` and `last_error` help debugging delivery failures.

## Python Database

Python is responsible for:
- receiving webhooks,
- validating them,
- deduplicating them,
- storing received payloads,
- processing accepted events,
- storing its own processed-task records.

### Table: received_events

Stores each accepted webhook event from Laravel.

#### Columns

- `id` - bigint, primary key
- `event_id` - string, required, unique
- `event_type` - string, required
- `source_service` - string, required
- `payload` - json, required
- `status` - string, required
- `received_at` - timestamp, required
- `processed_at` - timestamp, nullable
- `error_message` - text, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

#### Status values

- `received`
- `processing`
- `processed`
- `failed`

#### Notes

- `event_id` must have a unique constraint to support idempotency.
- The raw payload should be stored exactly as received.
- Duplicate deliveries should not create a second row for the same `event_id`.
- If an event is already present, Python should return success and skip duplicate processing.

### Table: processed_tasks

Stores the Python service’s local record created from the webhook event.

#### Columns

- `id` - bigint, primary key
- `source_task_id` - bigint, required
- `source_event_id` - string, required, unique
- `title` - string, required
- `description` - text, nullable
- `status` - string, required
- `processed_at` - timestamp, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

#### Status values

- `created`
- `completed`
- `failed`

#### Notes

- `source_task_id` refers to the task ID from Laravel, but it is not a foreign key because this database is owned by Python.
- `source_event_id` links this record back to the received event.
- This table exists to show that Python owns its own local business record.

### Optional Table: processing_logs

This table is optional in version 1.
It can be added if detailed processing logs are needed.

#### Suggested columns

- `id`
- `event_id`
- `level`
- `message`
- `context`
- `created_at`

For version 1, simple application logs may be enough, so this table can be skipped initially.

## Ownership Rules

- Laravel owns `tasks` and `webhook_deliveries`.
- Python owns `received_events` and `processed_tasks`.
- No service may directly query the other service database.
- Shared database access is not allowed.

## Key Constraints

### Laravel

- `tasks.id` is the primary key for tasks.
- `webhook_deliveries.task_id` references `tasks.id`.
- `webhook_deliveries.event_id` must be unique.

### Python

- `received_events.event_id` must be unique.
- `processed_tasks.source_event_id` should be unique.
- `processed_tasks.source_task_id` is stored as reference data only, not as a foreign key.

## State Notes

There are two separate state systems:

### Laravel task state
Tracks task and webhook delivery status from the producer side.

### Python event state
Tracks webhook intake and processing status from the consumer side.

These states must remain separate because each service owns its own perspective of the workflow.

## Version 1 Limits

Version 1 does not need:
- replay tables,
- dead-letter queue tables,
- audit trail tables,
- third-party integration tables,
- user accounts,
- permissions,
- multi-tenant support.

Those can be added later once the base event flow is working.

## Summary

Version 1 uses:
- one Laravel database for tasks and outbound delivery tracking,
- one Python database for received events and processed local records,
- unique event IDs for deduplication,
- explicit status columns for both services,
- no shared database access.
