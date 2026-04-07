try:
    from src.backend.main import app
    print("Successfully imported FastAPI app from src.backend.main")
except Exception as e:
    import sys
    print(f"FAILED to import FastAPI app: {e}")
    print(f"Python path: {sys.path}")
    # Create a fallback app to prevent 500
    from fastapi import FastAPI
    app = FastAPI()
    @app.get("/api/health")
    async def health():
        return {"status": "diag_mode", "error": str(e), "path": sys.path}
