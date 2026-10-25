from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PredictionRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0 - 23)")
    season: int = Field(..., ge=1, le=4, description="1: Spring, 2: Summer, 3: Fall, 4: Winter")
    month: int = Field(..., ge=1, le=12, description="Month (1 - 12)")
    weekday: int = Field(..., ge=0, le=6, description="Day of week (0: Sunday - 6: Saturday)")
    workingday: int = Field(..., ge=0, le=1, description="1 if neither weekend nor holiday, else 0")
    holiday: int = Field(default=0, ge=0, le=1, description="1 if public holiday, else 0")
    weather_condition: int = Field(..., ge=1, le=4, description="1: Clear, 2: Mist/Cloudy, 3: Light Rain/Snow, 4: Heavy Rain/Ice")
    temperature_c: float = Field(..., ge=-20.0, le=50.0, description="Temperature in Celsius (-20 to 50)")
    feeling_temperature_c: Optional[float] = Field(None, ge=-25.0, le=55.0, description="Apparent temperature in Celsius")
    humidity_pct: float = Field(..., ge=0.0, le=100.0, description="Relative humidity percentage (0 - 100)")
    wind_speed_kmh: float = Field(..., ge=0.0, le=100.0, description="Wind speed in km/h (0 - 100)")

class DemandFactors(BaseModel):
    is_commute_peak: bool
    weather_impact: str
    temperature_rating: str
    cyclical_phase: str

class PredictionResponse(BaseModel):
    predicted_demand: int
    demand_tier: str  # "Low", "Moderate", "High", "Peak Surge"
    confidence_interval: Dict[str, int]  # lower_bound, upper_bound
    factors: DemandFactors
    model_name: str
    disclaimer: str

class ModelEvaluationComparison(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2: float
    is_champion: bool

class ModelMetricsResponse(BaseModel):
    dataset_name: str
    source_url: str
    historical_context: str
    split_strategy: str
    training_samples: int
    test_samples: int
    target: str
    champion_model: str
    champion_metrics: Dict[str, float]
    models_evaluated: List[ModelEvaluationComparison]
    disclosures: List[str]

class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    champion_model: str
    version: str
