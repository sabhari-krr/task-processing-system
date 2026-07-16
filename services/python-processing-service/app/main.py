from fastapi import FastAPI

from app.routers import webhooks

app = FastAPI(title="Python Processing Service")

app.include_router(webhooks.router)
