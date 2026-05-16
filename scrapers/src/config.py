import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://waffar:waffar_secret@localhost:5432/waffar")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:5000")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "waffar_minio")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "waffar_minio_secret")
S3_BUCKET = os.getenv("S3_BUCKET", "waffar-images")
SCRAPER_CONCURRENCY = int(os.getenv("SCRAPER_CONCURRENCY", "5"))
SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", "30000"))
PROXY_URL = os.getenv("PROXY_URL", "")
