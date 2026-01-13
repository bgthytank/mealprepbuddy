from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # JWT Settings
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # DynamoDB Settings
    dynamodb_table_name: str = "mealprepbuddy"
    aws_region: str = "us-west-2"

    # For local development with DynamoDB Local
    dynamodb_endpoint_url: Optional[str] = None

    # Default household settings
    default_timezone: str = "America/Los_Angeles"
    default_dinner_time: str = "18:00"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
