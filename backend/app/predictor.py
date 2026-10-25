import os
import json
import numpy as np
import pandas as pd
import joblib
from .schemas import PredictionRequest, PredictionResponse, DemandFactors

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "metrics.json")
ANALYTICS_PATH = os.path.join(ARTIFACTS_DIR, "analytics_summary.json")

class DemandPredictor:
    def __init__(self):
        self.model = None
        self.metrics = None
        self.analytics = None
        self.champion_name = "Gradient Boosting Regressor"
        self.mae = 40.16
        self._load_artifacts()

    def _load_artifacts(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                self.metrics = json.load(f)
                self.champion_name = self.metrics.get("champion_model", self.champion_name)
                self.mae = self.metrics.get("champion_metrics", {}).get("mae", 40.16)
        if os.path.exists(ANALYTICS_PATH):
            with open(ANALYTICS_PATH, "r") as f:
                self.analytics = json.load(f)

    def is_ready(self) -> bool:
        return self.model is not None

    def predict(self, req: PredictionRequest) -> PredictionResponse:
        if self.model is None:
            raise RuntimeError("Model artifact not loaded or unavailable.")

        # Compute feeling temperature if not provided
        feeling_c = req.feeling_temperature_c if req.feeling_temperature_c is not None else req.temperature_c
        
        # UCI Normalized Scalings:
        # temp: normalized Celsius: (t_actual = temp * 41)
        norm_temp = max(0.0, min(1.0, req.temperature_c / 41.0))
        # atemp: normalized feeling Celsius: (atemp_actual = atemp * 50)
        norm_atemp = max(0.0, min(1.0, feeling_c / 50.0))
        # hum: normalized humidity (0 - 1)
        norm_hum = max(0.0, min(1.0, req.humidity_pct / 100.0))
        # windspeed: normalized wind speed (norm = kmh / 67)
        norm_wind = max(0.0, min(1.0, req.wind_speed_kmh / 67.0))
        
        # Cyclical transformations
        hr_sin = np.sin(2 * np.pi * req.hour / 24.0)
        hr_cos = np.cos(2 * np.pi * req.hour / 24.0)
        mnth_sin = np.sin(2 * np.pi * req.month / 12.0)
        mnth_cos = np.cos(2 * np.pi * req.month / 12.0)
        
        # Engineered interaction terms
        is_commute_hour = 1 if req.hour in [7, 8, 9, 17, 18, 19] else 0
        is_commute_peak = is_commute_hour * req.workingday
        is_adverse_weather = 1 if req.weather_condition >= 3 else 0
        temp_discomfort = abs(norm_atemp - norm_temp)
        
        # In the 2011-2012 dataset, yr=1 corresponds to the mature year (2012)
        yr_feature = 1
        
        feature_dict = {
            'season': [req.season],
            'yr': [yr_feature],
            'mnth': [req.month],
            'hr': [req.hour],
            'holiday': [req.holiday],
            'weekday': [req.weekday],
            'workingday': [req.workingday],
            'weathersit': [req.weather_condition],
            'temp': [norm_temp],
            'atemp': [norm_atemp],
            'hum': [norm_hum],
            'windspeed': [norm_wind],
            'hr_sin': [hr_sin],
            'hr_cos': [hr_cos],
            'mnth_sin': [mnth_sin],
            'mnth_cos': [mnth_cos],
            'is_commute_peak': [is_commute_peak],
            'is_adverse_weather': [is_adverse_weather],
            'temp_discomfort': [temp_discomfort]
        }
        
        input_df = pd.DataFrame(feature_dict)
        raw_pred = self.model.predict(input_df)[0]
        pred_val = int(round(max(0.0, raw_pred)))
        
        # Confidence interval derived from held-out MAE
        lower_bound = max(0, int(round(pred_val - self.mae)))
        upper_bound = int(round(pred_val + self.mae))
        
        # Determine demand tier
        if pred_val < 80:
            tier = "Low Demand"
        elif pred_val < 250:
            tier = "Moderate Demand"
        elif pred_val < 500:
            tier = "High Demand"
        else:
            tier = "Peak Surge Demand"
            
        # Explanatory factors
        weather_map = {
            1: "Optimal clear / partly cloudy conditions",
            2: "Mild mist / overcast dampening",
            3: "Adverse rain or snow reducing fleet velocity",
            4: "Severe heavy storm conditions suppressing transit"
        }
        
        if req.temperature_c < 10:
            temp_desc = "Cold conditions depressing leisure ridership"
        elif req.temperature_c <= 28:
            temp_desc = "Optimal thermal window for micro-mobility"
        else:
            temp_desc = "Elevated heat index mildly suppressing rides"
            
        factors = DemandFactors(
            is_commute_peak=bool(is_commute_peak),
            weather_impact=weather_map.get(req.weather_condition, "Normal"),
            temperature_rating=temp_desc,
            cyclical_phase=f"Hour {req.hour:02d}:00 diurnal rhythm"
        )
        
        return PredictionResponse(
            predicted_demand=pred_val,
            demand_tier=tier,
            confidence_interval={"lower_bound": lower_bound, "upper_bound": upper_bound},
            factors=factors,
            model_name=self.champion_name,
            disclaimer="Estimate is computed by a Gradient Boosting Regressor trained on 17,379 chronological observations from Capital Bikeshare (2011-2012). It provides a statistical benchmark rather than guaranteed real-time telematics."
        )

predictor = DemandPredictor()
