import enum


class ReceivedEventStatus(str, enum.Enum):
    RECEIVED = "received"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class ProcessedTaskStatus(str, enum.Enum):
    CREATED = "created"
    COMPLETED = "completed"
    FAILED = "failed"
