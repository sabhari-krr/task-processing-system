from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreatedData(BaseModel):
    task_id: int
    title: str
    description: str | None = None


class WebhookPayload(BaseModel):
    event_id: str
    event_type: str
    occurred_at: datetime
    data: TaskCreatedData


class WebhookAccepted(BaseModel):
    message: str = Field(default="Webhook accepted")


class WebhookDuplicate(BaseModel):
    message: str = Field(default="Duplicate event ignored")
