from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import advice, chat, matching, gift

app = FastAPI(title="Waffar AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(advice.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
app.include_router(gift.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "healthy", "service": "waffar-ai"}
