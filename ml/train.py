import os
import zipfile
import json
import urllib.request
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
import joblib

DATASET_URL = "https://archive.ics.uci.edu/static/public/275/bike+sharing+dataset.zip"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "dataset")
ARTIFACTS_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "artifacts")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def download_and_extract_dataset():
    zip_path = os.path.join(DATA_DIR, "bike_sharing_dataset.zip")
    hour_csv_path = os.path.join(DATA_DIR, "hour.csv")
    
    if not os.path.exists(hour_csv_path):
        print(f"Downloading UCI Bike Sharing dataset from {DATASET_URL}...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(DATASET_URL, headers=headers)
        with urllib.request.urlopen(req) as resp, open(zip_path, 'wb') as out_f:
            out_f.write(resp.read())
        
        print("Extracting dataset archive...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(DATA_DIR)
        print("Extraction complete.")
    else:
        print("hour.csv already present in dataset directory.")
    
    return hour_csv_path

def engineer_features(df):
    """
    Feature engineering without target leakage.
    Original UCI columns:
    - season: 1:springer, 2:summer, 3:fall, 4:winter
    - yr: 0:2011, 1:2012
    - mnth: 1 to 12
    - hr: 0 to 23
    - holiday: 0 or 1
    - weekday: 0 to 6
    - workingday: 1 if day is neither weekend nor holiday, else 0
    - weathersit: 1:Clear, 2:Mist, 3:Light Snow/Rain, 4:Heavy Rain/Ice
    - temp: Normalized temperature in Celsius (t_actual = temp * 41)
    - atemp: Normalized feeling temperature in Celsius (atemp_actual = atemp * 50)
    - hum: Normalized humidity (hum_actual = hum * 100)
    - windspeed: Normalized wind speed (windspeed_actual = windspeed * 67)
    """
    X = pd.DataFrame(index=df.index)
    
    # Core temporal features
    X['season'] = df['season']
    X['yr'] = df['yr']
    X['mnth'] = df['mnth']
    X['hr'] = df['hr']
    X['holiday'] = df['holiday']
    X['weekday'] = df['weekday']
    X['workingday'] = df['workingday']
    X['weathersit'] = df['weathersit']
    
    # Weather metrics (normalized as in dataset)
    X['temp'] = df['temp']
    X['atemp'] = df['atemp']
    X['hum'] = df['hum']
    X['windspeed'] = df['windspeed']
    
    # Cyclical hour features
    X['hr_sin'] = np.sin(2 * np.pi * df['hr'] / 24.0)
    X['hr_cos'] = np.cos(2 * np.pi * df['hr'] / 24.0)
    
    # Cyclical month features
    X['mnth_sin'] = np.sin(2 * np.pi * df['mnth'] / 12.0)
    X['mnth_cos'] = np.cos(2 * np.pi * df['mnth'] / 12.0)
    
    # Domain interaction features
    # Commute peak interaction (typical peaks at 8 AM and 17-18 PM on working days)
    is_commute_hour = df['hr'].isin([7, 8, 9, 17, 18, 19]).astype(int)
    X['is_commute_peak'] = is_commute_hour * df['workingday']
    
    # Severe weather indicator
    X['is_adverse_weather'] = (df['weathersit'] >= 3).astype(int)
    
    # Temperature discomfort index (difference between feeling temp and actual temp)
    X['temp_discomfort'] = (df['atemp'] - df['temp']).abs()
    
    return X

def compute_historical_analytics(df):
    """
    Precompute verified historical aggregates from actual 17,379 observations
    so the backend and analytics dashboard present 100% genuine data.
    """
    analytics = {}
    
    # Total dataset stats
    analytics["dataset_summary"] = {
        "total_records": int(len(df)),
        "time_range": f"{df['dteday'].min()} to {df['dteday'].max()}",
        "total_rentals": int(df['cnt'].sum()),
        "mean_hourly_rentals": round(float(df['cnt'].mean()), 2),
        "median_hourly_rentals": int(df['cnt'].median()),
        "max_hourly_rentals": int(df['cnt'].max()),
        "std_hourly_rentals": round(float(df['cnt'].std()), 2)
    }
    
    # Average hourly demand by workingday vs non-workingday
    hourly_working = df[df['workingday'] == 1].groupby('hr')['cnt'].mean().round(1).to_dict()
    hourly_nonworking = df[df['workingday'] == 0].groupby('hr')['cnt'].mean().round(1).to_dict()
    analytics["hourly_pattern"] = [
        {
            "hour": h,
            "workingday_avg": hourly_working.get(h, 0),
            "non_workingday_avg": hourly_nonworking.get(h, 0),
            "overall_avg": round(float(df[df['hr'] == h]['cnt'].mean()), 1)
        }
        for h in range(24)
    ]
    
    # Seasonal breakdown
    season_names = {1: "Spring", 2: "Summer", 3: "Fall", 4: "Winter"}
    season_stats = df.groupby('season')['cnt'].agg(['mean', 'median', 'std', 'sum']).round(1)
    analytics["season_pattern"] = [
        {
            "season_id": s,
            "season_name": season_names.get(s, f"Season {s}"),
            "mean_hourly": float(season_stats.loc[s, 'mean']),
            "median_hourly": float(season_stats.loc[s, 'median']),
            "total_rentals": int(season_stats.loc[s, 'sum'])
        }
        for s in season_stats.index
    ]
    
    # Weather situation breakdown
    weather_names = {
        1: "Clear / Partly Cloudy",
        2: "Mist / Cloudy",
        3: "Light Snow / Light Rain",
        4: "Heavy Rain / Ice Pellets"
    }
    weather_stats = df.groupby('weathersit')['cnt'].agg(['mean', 'count']).round(1)
    analytics["weather_pattern"] = [
        {
            "weathersit_id": int(w),
            "weather_name": weather_names.get(w, f"Condition {w}"),
            "mean_hourly": float(weather_stats.loc[w, 'mean']),
            "sample_count": int(weather_stats.loc[w, 'count'])
        }
        for w in weather_stats.index
    ]
    
    # Temperature vs Demand bins (0-10C, 10-20C, 20-30C, 30C+)
    # actual temp in C is temp * 41
    df['temp_c'] = df['temp'] * 41.0
    temp_bins = [0, 10, 20, 30, 45]
    temp_labels = ["< 10°C (Cold)", "10°C - 20°C (Mild)", "20°C - 30°C (Warm/Optimal)", "30°C+ (Hot)"]
    df['temp_bin'] = pd.cut(df['temp_c'], bins=temp_bins, labels=temp_labels)
    temp_stats = df.groupby('temp_bin', observed=False)['cnt'].agg(['mean', 'count']).round(1)
    analytics["temperature_pattern"] = [
        {
            "temp_range": label,
            "mean_hourly": float(temp_stats.loc[label, 'mean']) if not pd.isna(temp_stats.loc[label, 'mean']) else 0.0,
            "sample_count": int(temp_stats.loc[label, 'count']) if not pd.isna(temp_stats.loc[label, 'count']) else 0
        }
        for label in temp_labels
    ]
    
    return analytics

def train_and_evaluate():
    csv_path = download_and_extract_dataset()
    df = pd.read_csv(csv_path)
    
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")
    
    # Verification of data integrity
    assert (df['casual'] + df['registered'] == df['cnt']).all(), "Target integrity check failed: cnt != casual + registered"
    
    # Ensure chronological order
    df['dteday'] = pd.to_datetime(df['dteday'])
    df = df.sort_values(by=['dteday', 'hr']).reset_index(drop=True)
    
    # Compute verified historical analytics
    analytics_data = compute_historical_analytics(df.copy())
    with open(os.path.join(ARTIFACTS_DIR, "analytics_summary.json"), "w") as f:
        json.dump(analytics_data, f, indent=2)
    print("Saved genuine analytics summary to backend/artifacts/analytics_summary.json")
    
    # Chronological Split:
    # 2011-01-01 to 2012-09-30 (~85%): Training set (15,211 hours)
    # 2012-10-01 to 2012-12-31 (~15%): Held-out Test set (2,168 hours)
    # This rigorously tests predicting future demand rather than random shuffling!
    split_date = pd.to_datetime("2012-10-01")
    train_mask = df['dteday'] < split_date
    test_mask = df['dteday'] >= split_date
    
    df_train = df[train_mask].copy()
    df_test = df[test_mask].copy()
    
    print(f"Chronological split:")
    print(f"  Training set: {len(df_train)} rows ({df_train['dteday'].min().strftime('%Y-%m-%d')} to {df_train['dteday'].max().strftime('%Y-%m-%d')})")
    print(f"  Held-out Test set: {len(df_test)} rows ({df_test['dteday'].min().strftime('%Y-%m-%d')} to {df_test['dteday'].max().strftime('%Y-%m-%d')})")
    
    # Feature engineering
    X_train = engineer_features(df_train)
    y_train = df_train['cnt']
    
    X_test = engineer_features(df_test)
    y_test = df_test['cnt']
    
    feature_names = list(X_train.columns)
    print(f"Features used ({len(feature_names)}): {feature_names}")
    
    # 1. Baseline Model: Historical Hourly Median by (hr, workingday)
    train_lookup = df_train.groupby(['hr', 'workingday'])['cnt'].median()
    baseline_preds = []
    for _, row in df_test.iterrows():
        key = (row['hr'], row['workingday'])
        pred = train_lookup.get(key, df_train['cnt'].median())
        baseline_preds.append(pred)
    baseline_preds = np.array(baseline_preds)
    
    baseline_mae = mean_absolute_error(y_test, baseline_preds)
    baseline_rmse = np.sqrt(mean_squared_error(y_test, baseline_preds))
    baseline_r2 = r2_score(y_test, baseline_preds)
    
    print(f"\n[Baseline - Historical Hour x Workingday Median]")
    print(f"  MAE:  {baseline_mae:.2f}")
    print(f"  RMSE: {baseline_rmse:.2f}")
    print(f"  R2:   {baseline_r2:.4f}")
    
    # 2. Linear / Ridge Model
    ridge = Ridge(alpha=10.0)
    ridge.fit(X_train, y_train)
    ridge_preds = np.clip(ridge.predict(X_test), 0, None)
    ridge_mae = mean_absolute_error(y_test, ridge_preds)
    ridge_rmse = np.sqrt(mean_squared_error(y_test, ridge_preds))
    ridge_r2 = r2_score(y_test, ridge_preds)
    
    print(f"\n[Ridge Regression]")
    print(f"  MAE:  {ridge_mae:.2f}")
    print(f"  RMSE: {ridge_rmse:.2f}")
    print(f"  R2:   {ridge_r2:.4f}")
    
    # 3. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_preds = np.clip(rf.predict(X_test), 0, None)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
    rf_r2 = r2_score(y_test, rf_preds)
    
    print(f"\n[Random Forest Regressor]")
    print(f"  MAE:  {rf_mae:.2f}")
    print(f"  RMSE: {rf_rmse:.2f}")
    print(f"  R2:   {rf_r2:.4f}")
    
    # 4. HistGradientBoostingRegressor (Fast, highly accurate gradient boosting)
    hgbr = HistGradientBoostingRegressor(
        max_iter=250,
        learning_rate=0.08,
        max_leaf_nodes=31,
        min_samples_leaf=20,
        l2_regularization=1.0,
        random_state=42
    )
    hgbr.fit(X_train, y_train)
    hgbr_preds = np.clip(hgbr.predict(X_test), 0, None)
    hgbr_mae = mean_absolute_error(y_test, hgbr_preds)
    hgbr_rmse = np.sqrt(mean_squared_error(y_test, hgbr_preds))
    hgbr_r2 = r2_score(y_test, hgbr_preds)
    
    print(f"\n[HistGradientBoosting Regressor]")
    print(f"  MAE:  {hgbr_mae:.2f}")
    print(f"  RMSE: {hgbr_rmse:.2f}")
    print(f"  R2:   {hgbr_r2:.4f}")
    
    # Model Selection: Pick the champion based on held-out RMSE / R2
    models_compared = [
        {"model_name": "Historical Median Baseline", "mae": round(baseline_mae, 2), "rmse": round(baseline_rmse, 2), "r2": round(baseline_r2, 4), "is_champion": False},
        {"model_name": "Ridge Regression", "mae": round(ridge_mae, 2), "rmse": round(ridge_rmse, 2), "r2": round(ridge_r2, 4), "is_champion": False},
        {"model_name": "Random Forest Regressor", "mae": round(rf_mae, 2), "rmse": round(rf_rmse, 2), "r2": round(rf_r2, 4), "is_champion": False},
        {"model_name": "Gradient Boosting Regressor", "mae": round(hgbr_mae, 2), "rmse": round(hgbr_rmse, 2), "r2": round(hgbr_r2, 4), "is_champion": False}
    ]
    
    # Select best model (lowest RMSE)
    best_candidate = min(models_compared[1:], key=lambda m: m['rmse'])
    for m in models_compared:
        if m['model_name'] == best_candidate['model_name']:
            m['is_champion'] = True
    
    champion_model = hgbr if best_candidate['model_name'] == "Gradient Boosting Regressor" else rf
    champion_model_name = best_candidate['model_name']
    
    print(f"\nChampion Selected: {champion_model_name} (RMSE={best_candidate['rmse']}, R2={best_candidate['r2']})")
    
    # Save model artifacts
    joblib.dump(champion_model, os.path.join(ARTIFACTS_DIR, "model.joblib"))
    print(f"Saved model to {os.path.join(ARTIFACTS_DIR, 'model.joblib')}")
    
    # Save feature schema
    feature_schema = {
        "features": feature_names,
        "input_ranges": {
            "season": {"type": "integer", "min": 1, "max": 4, "labels": {1: "Spring", 2: "Summer", 3: "Fall", 4: "Winter"}},
            "hr": {"type": "integer", "min": 0, "max": 23, "description": "Hour of the day (0 to 23)"},
            "holiday": {"type": "integer", "min": 0, "max": 1, "description": "0 = No, 1 = Holiday"},
            "weekday": {"type": "integer", "min": 0, "max": 6, "labels": {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}},
            "workingday": {"type": "integer", "min": 0, "max": 1, "description": "1 if neither weekend nor holiday, else 0"},
            "weathersit": {"type": "integer", "min": 1, "max": 4, "labels": {1: "Clear/Partly Cloudy", 2: "Mist/Cloudy", 3: "Light Snow/Rain", 4: "Heavy Rain/Ice"}},
            "temp_c": {"type": "float", "min": -10.0, "max": 45.0, "unit": "Celsius", "norm_formula": "temp = (celsius + 8) / 47 or celsius / 41"},
            "humidity": {"type": "float", "min": 0.0, "max": 100.0, "unit": "%", "norm_formula": "hum = humidity / 100"},
            "windspeed_kmh": {"type": "float", "min": 0.0, "max": 70.0, "unit": "km/h", "norm_formula": "windspeed = windspeed_kmh / 67"}
        },
        "target": "cnt (total hourly rentals)",
        "excluded_features": ["casual", "registered", "instant", "dteday"]
    }
    with open(os.path.join(ARTIFACTS_DIR, "feature_schema.json"), "w") as f:
        json.dump(feature_schema, f, indent=2)
    
    # Save model evaluation metrics
    metrics_summary = {
        "dataset_name": "UCI Machine Learning Repository - Bike Sharing Dataset (hour.csv)",
        "source_url": "https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset",
        "historical_context": "Capital Bikeshare system, Washington D.C., years 2011-2012",
        "split_strategy": "Chronological (Train: 2011-01-01 to 2012-09-30; Held-out Test: 2012-10-01 to 2012-12-31)",
        "training_samples": len(df_train),
        "test_samples": len(df_test),
        "target": "cnt (total hourly rentals)",
        "champion_model": champion_model_name,
        "champion_metrics": {
            "mae": best_candidate['mae'],
            "rmse": best_candidate['rmse'],
            "r2": best_candidate['r2']
        },
        "models_evaluated": models_compared,
        "disclosures": [
            "Dataset represents Capital Bikeshare in Washington D.C. (2011-2012), not modern dockless e-bike operations.",
            "Predictions reflect historical behavioral patterns under given meteorological and calendar conditions.",
            "Excludes registered and casual sub-counts to eliminate target leakage."
        ]
    }
    with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print("Saved evaluation metrics to backend/artifacts/metrics.json")

if __name__ == "__main__":
    train_and_evaluate()
