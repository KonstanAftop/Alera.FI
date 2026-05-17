"""Pamor Backend - Main Application Entry Point

This is the main entry point for the Pamor backend service.
All routes are organized into separate router modules.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import HOST, PORT
from app.routers import auth, registration, telegram, api

# Create FastAPI application
app = FastAPI(
    title="Pamor Backend Service",
    description="Backend API for Pamor - Flood Monitoring Dashboard",
    version="1.0.0",
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(registration.router)
app.include_router(telegram.router)
app.include_router(api.router)


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "Pamor Backend is running", "version": "1.0.0"}


@app.get("/instruments")
async def get_instruments():
    """Legacy endpoint - redirects to registration router."""
    from app.routers.registration import get_instruments as _get_instruments
    return await _get_instruments()


@app.get("/geocoding/search")
async def search_location(q: str):
    """Legacy endpoint - redirects to registration router."""
    from app.routers.registration import search_location as _search_location
    return await _search_location(q)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
