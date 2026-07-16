from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./python_processing.db"
    webhook_shared_secret: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
