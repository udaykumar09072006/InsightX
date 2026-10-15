"""InsightX Backend Configuration
Loads environment variables and application runtime parameters.
"""
import os
from pathlib import Path
from dataclasses import dataclass

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"
DB_PATH = DATA_DIR / "insightx.db"

@dataclass
class Settings:
    APP_NAME: str = "InsightX AI Analytics Copilot"
    VERSION: str = "1.0.0"
    DATABASE_PATH: Path = DB_PATH
    SQL_TIMEOUT_SECONDS: int = int(os.getenv("SQL_TIMEOUT_SECONDS", "10"))
    SQL_MAX_ROWS: int = int(os.getenv("SQL_MAX_ROWS", "500"))
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.8-flash")
    LLM_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ALLOWED_ORIGINS: list = None

    def __post_init__(self):
        if self.ALLOWED_ORIGINS is None:
            self.ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

settings = Settings()
