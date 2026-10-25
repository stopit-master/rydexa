import urllib.request
import json
import os
import joblib

def run_verification():
    print("=== 1. VERIFYING ML ARTIFACTS & MODEL INTEGRITY ===")
    artifacts_dir = r"C:\Users\dell\.gemini\antigravity\scratch\rydexa\backend\artifacts"
    model = joblib.load(os.path.join(artifacts_dir, "model.joblib"))
    print("Loaded Model Type:", type(model).__name__)

    with open(os.path.join(artifacts_dir, "metrics.json")) as f:
        metrics = json.load(f)
    print("Champion Model:", metrics["champion_model"])
    print("Held-out R2 Score:", metrics["champion_metrics"]["r2"])
    print("Held-out MAE:", metrics["champion_metrics"]["mae"])

    with open(os.path.join(artifacts_dir, "feature_schema.json")) as f:
        schema = json.load(f)
    print(f"Verified Feature Set ({len(schema['features'])} features): {schema['features']}")

    print("\n=== 2. VERIFYING LIVE FASTAPI PREDICTION WORKFLOW ===")
    url = "http://127.0.0.1:8000/api/predict"
    test_cases = [
        {
            "label": "Morning Rush (8 AM, Sunny)",
            "payload": {
                "hour": 8, "season": 3, "month": 9, "weekday": 3, "workingday": 1,
                "holiday": 0, "weather_condition": 1, "temperature_c": 22.0,
                "humidity_pct": 60.0, "wind_speed_kmh": 12.0
            }
        },
        {
            "label": "Evening Peak Surge (5 PM, Warm)",
            "payload": {
                "hour": 17, "season": 2, "month": 6, "weekday": 4, "workingday": 1,
                "holiday": 0, "weather_condition": 1, "temperature_c": 27.0,
                "humidity_pct": 48.0, "wind_speed_kmh": 14.0
            }
        },
        {
            "label": "Storm Dampening (8 AM, Rainy)",
            "payload": {
                "hour": 8, "season": 4, "month": 11, "weekday": 1, "workingday": 1,
                "holiday": 0, "weather_condition": 3, "temperature_c": 5.0,
                "humidity_pct": 90.0, "wind_speed_kmh": 28.0
            }
        }
    ]

    for tc in test_cases:
        req = urllib.request.Request(
            url,
            data=json.dumps(tc["payload"]).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            assert r.status == 200
            data = json.loads(r.read().decode("utf-8"))
            print(f"{tc['label']}:")
            print(f"  -> Predicted Demand: {data['predicted_demand']} rentals/hr")
            print(f"  -> Demand Tier: {data['demand_tier']}")
            print(f"  -> Confidence Interval: {data['confidence_interval']}")
            print(f"  -> Factors: {data['factors']}")

    print("\n=== 3. VERIFYING FRONTEND LIVE STATUS ===")
    with urllib.request.urlopen("http://localhost:3000", timeout=5) as r:
        assert r.status == 200
        print(f"Frontend Status: {r.status} OK")

    print("\n=== ALL VERIFICATION STEPS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_verification()
