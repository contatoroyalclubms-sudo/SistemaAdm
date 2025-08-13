"""
FastAPI Server for Python AI Service
Provides health endpoint and AI model ensemble functionality
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import os
import sys

sys.path.append('/app/src')

from ia.cerebro_quantico.modelos_ensemble import ModelosEnsembleSupremo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Royal Club AI Service",
    description="AI ensemble models for trading and automation",
    version="1.0.0"
)

ai_model = None

@app.on_event("startup")
async def startup_event():
    """Initialize AI models on startup"""
    global ai_model
    try:
        logger.info("🎼 Initializing AI Ensemble Models...")
        ai_model = ModelosEnsembleSupremo()
        logger.info("✅ AI Models initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize AI models: {e}")
        ai_model = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "service": "Royal Club AI Service",
            "timestamp": datetime.utcnow().isoformat(),
            "ai_models_loaded": ai_model is not None,
            "environment": os.getenv("NODE_ENV", "development")
        }
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Royal Club AI Service",
        "status": "running",
        "endpoints": ["/health", "/predict"]
    }

@app.post("/predict")
async def predict(data: dict):
    """Make predictions using AI ensemble"""
    if ai_model is None:
        raise HTTPException(
            status_code=503,
            detail="AI models not initialized"
        )
    
    try:
        return {
            "status": "success",
            "message": "AI prediction endpoint ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting Royal Club AI Service on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
