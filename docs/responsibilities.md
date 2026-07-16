# Service Responsibilities

## Purpose

This project is a small microservices learning system with three parts:

- React frontend
- Laravel Task Service
- Python Processing Service

The goal is to keep responsibilities clear so each part has one primary reason to change and services do not become tightly coupled [web:139][web:150].

## System Overview

The system works like this:

1. A user creates a task from the React frontend.
2. The frontend sends the request to Laravel.
3. Laravel stores the task and dispatches a `task.created` webhook.
4. Python receives the webhook, validates it, stores the event, and processes it.
5. Python stores its own processed result in its own database.
6. Laravel remains the main service used by the frontend [web:154][web:157].

## Frontend Responsibilities

The React frontend is responsible for:

- Displaying the UI for task creation.
- Calling Laravel APIs to create and view tasks.
- Showing task status returned by Laravel.
- Providing a simple demo interface for the system.

The React frontend is not responsible for:

- Calling Python directly in version 1.
- Handling webhook delivery logic.
- Storing business data as the source of truth.
- Managing retries, signatures, or event deduplication.

## Laravel Task Service Responsibilities

The Laravel Task Service is responsible for:

- Exposing public APIs for the frontend.
- Validating task creation requests.
- Storing tasks in its own database.
- Creating the outbound `task.created` event payload.
- Sending the webhook to the Python service.
- Tracking webhook delivery attempts and delivery status.
- Returning task information and status to the frontend.

The Laravel Task Service is not responsible for:

- Reading Python’s database directly.
- Executing Python’s internal processing logic.
- Depending on Python’s internal schema.
- Letting the frontend bypass it to reach Python.

Laravel is the main system of entry for the application [web:139][web:150].

## Python Processing Service Responsibilities

The Python Processing Service is responsible for:

- Exposing the webhook receiver endpoint.
- Authenticating or verifying incoming webhook requests.
- Validating webhook payload structure.
- Deduplicating events using `event_id`.
- Storing received events in its own database.
- Processing accepted events.
- Creating its own local processed-task records.
- Storing processing logs and processing state.

The Python Processing Service is not responsible for:

- Serving the frontend directly in version 1.
- Reading Laravel’s database directly.
- Owning the task creation user flow.
- Defining Laravel’s public API.

Python is the downstream consumer and processor service [web:154][web:157].

## Database Ownership

Each backend service owns its own database and must access only its own data directly.

- Laravel database owns task records and outbound delivery records.
- Python database owns received event records, processing logs, and processed task records.
- React frontend does not own a database in version 1.

No backend service should directly query or modify the other service’s database [web:53][web:125][web:128].

## Communication Rules

The allowed communication path in version 1 is:

- React -> Laravel
- Laravel -> Python
- Laravel -> Laravel database
- Python -> Python database

The following are not allowed in version 1:

- React -> Python
- Laravel -> Python database
- Python -> Laravel database
- Shared database between services

This keeps the service boundaries clear and avoids tight coupling [web:139][web:150].

## Version 1 Scope Rule

In version 1, the Python service only receives, validates, stores, and processes the event into its own local records.

It does not perform extra business actions such as:

- creating Notion pages,
- sending emails,
- generating PDFs,
- posting to Slack,
- calling third-party APIs.

Those can be added in later versions after the base event flow is complete.

## Summary

This project uses:

- React as the client application,
- Laravel as the public task service,
- Python as the webhook consumer and processing service.

Each backend service owns its own database, and services communicate only through defined APIs and webhook contracts.
