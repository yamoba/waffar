from celery import Celery
from celery.schedules import crontab
from .config import REDIS_URL

app = Celery("waffar_scrapers", broker=REDIS_URL, backend=REDIS_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Cairo",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
    task_default_queue="scraper",
    task_routes={
        "src.tasks.scrape_store": {"queue": "scraper"},
        "src.tasks.scrape_product": {"queue": "scraper"},
        "src.tasks.update_aggregates": {"queue": "maintenance"},
        "src.tasks.check_alerts": {"queue": "maintenance"},
    },
)

app.conf.beat_schedule = {
    "scrape-hot-products": {
        "task": "src.tasks.scrape_all_stores",
        "schedule": 300.0,  # 5 minutes
        "args": ("HOT",),
    },
    "scrape-medium-products": {
        "task": "src.tasks.scrape_all_stores",
        "schedule": 1800.0,  # 30 minutes
        "args": ("MEDIUM",),
    },
    "scrape-daily-products": {
        "task": "src.tasks.scrape_all_stores",
        "schedule": crontab(hour=3, minute=0),  # 3 AM Cairo
        "args": ("DAILY",),
    },
    "update-aggregates": {
        "task": "src.tasks.update_aggregates",
        "schedule": 600.0,  # 10 minutes
    },
    "check-alerts": {
        "task": "src.tasks.check_alerts",
        "schedule": 300.0,  # 5 minutes
    },
}

app.autodiscover_tasks(["src"])
