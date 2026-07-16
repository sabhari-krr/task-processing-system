import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db
from app.enums import ProcessedTaskStatus, ReceivedEventStatus
from app.security import verify_signature

router = APIRouter()


def _validation_error_response(exc: ValidationError) -> JSONResponse:
    errors: dict[str, list[str]] = {}
    for err in exc.errors():
        field = str(err["loc"][-1])
        errors.setdefault(field, []).append(err["msg"])

    return JSONResponse(status_code=422, content={"message": "Invalid payload", "errors": errors})


@router.post("/webhooks/tasks")
async def receive_task_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_signature: str | None = Header(default=None),
):
    raw_body = await request.body()

    if not x_webhook_signature or not verify_signature(
        settings.webhook_shared_secret, raw_body, x_webhook_signature
    ):
        return JSONResponse(status_code=401, content={"message": "Invalid signature"})

    try:
        payload = schemas.WebhookPayload.model_validate_json(raw_body)
    except ValidationError as exc:
        return _validation_error_response(exc)

    if payload.event_type != "task.created":
        return JSONResponse(
            status_code=422,
            content={
                "message": "Invalid payload",
                "errors": {"event_type": ["The event_type field must be task.created."]},
            },
        )

    existing = db.query(models.ReceivedEvent).filter_by(event_id=payload.event_id).first()
    if existing:
        return JSONResponse(status_code=200, content={"message": "Duplicate event ignored"})

    event = models.ReceivedEvent(
        event_id=payload.event_id,
        event_type=payload.event_type,
        source_service="laravel-task-service",
        payload=json.loads(raw_body),
        status=ReceivedEventStatus.RECEIVED.value,
        received_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    event.status = ReceivedEventStatus.PROCESSING.value
    db.commit()

    try:
        processed = models.ProcessedTask(
            source_task_id=payload.data.task_id,
            source_event_id=payload.event_id,
            title=payload.data.title,
            description=payload.data.description,
            status=ProcessedTaskStatus.CREATED.value,
        )
        db.add(processed)
        db.commit()
        db.refresh(processed)

        processed.status = ProcessedTaskStatus.COMPLETED.value
        processed.processed_at = datetime.now(timezone.utc)
        db.commit()

        event.status = ReceivedEventStatus.PROCESSED.value
        event.processed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        event.status = ReceivedEventStatus.FAILED.value
        event.error_message = str(exc)[:1000]
        db.commit()

    return JSONResponse(status_code=202, content={"message": "Webhook accepted"})
