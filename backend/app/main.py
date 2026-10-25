import os
import json
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictionRequest, PredictionResponse, ModelMetricsResponse, HealthResponse
from .predictor import predictor

app = FastAPI(
    title="RYDEXA Demand Intelligence API",
    description="Empirical machine learning inference API for bike-sharing demand forecasting.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=HealthResponse)
def get_health():
    is_ready = predictor.is_ready()
    return HealthResponse(
        status="operational" if is_ready else "degraded",
        service="RYDEXA Demand Intelligence Backend",
        model_loaded=is_ready,
        champion_model=predictor.champion_name if is_ready else "None",
        version="1.0.0"
    )

@app.post("/api/predict", response_model=PredictionResponse)
def predict_demand(req: PredictionRequest):
    if not predictor.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Predictive model artifact is not available. Ensure training pipeline has generated model.joblib."
        )
    try:
        return predictor.predict(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inference failure: {str(e)}"
        )

@app.get("/api/model-metrics")
def get_model_metrics():
    if predictor.metrics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metrics artifact not found."
        )
    return predictor.metrics

@app.get("/api/analytics")
def get_historical_analytics():
    if predictor.analytics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historical analytics summary artifact not found."
        )
    return predictor.analytics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
