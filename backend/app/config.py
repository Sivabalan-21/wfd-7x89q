from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Wind Forecast Decision Support"
    API_V1_STR: str = "/api"
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    CACHE_DIR: str = os.getenv("CACHE_DIR", os.path.join(BASE_DIR, "data_cache"))
    CACHE_TTL_SECONDS: int = 3600 * 24  # 24 hours default for historical data
    DEFAULT_CUTOFF_HOUR: int = 11  # EPEX SPOT GB Day-Ahead gate closure (11:00 GMT/UTC)
    DEFAULT_CUTOFF_MINUTE: int = 0
    ALLOWED_ORIGINS: Union[List[str], str] = ["*"]
    REQUEST_TIMEOUT: float = 30.0
    MAX_RETRIES: int = 3

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

settings = Settings()
