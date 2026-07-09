"""Compatibility entrypoint — the app now lives in app/. Kept so `uvicorn server:app` still works."""
from app.main import app
