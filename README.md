# RYDEXA — Micro-Mobility Demand Intelligence Platform

RYDEXA is an enterprise-grade demand prediction and intelligence platform built for commercial bike-sharing operators, micro-mobility fleets, and urban transit authorities. It bridges empirical machine learning trained on verified historical data with an Apple-inspired Next.js frontend and an asynchronous FastAPI inference engine.

---

## Architecture Overview

```
rydexa/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI REST endpoints & CORS configuration
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   └── predictor.py        # Model loader, feature normalization, and inference
│   ├── artifacts/
│   │   ├── model.joblib        # Trained Gradient Boosting Regressor (Champion)
│   │   ├── metrics.json        # Verified chronological held-out metrics
│   │   ├── feature_schema.json # Feature definitions & physical boundary constraints
│   │   └── analytics_summary.json # 17,379 precomputed empirical aggregations
│   ├── requirements.txt        # Backend Python dependencies
│   └── run.py                  # Standalone backend server runner
├── ml/
│   ├── train.py                # Reproducible ML training pipeline
│   ├── generate_nb.py          # Generator for Google Colab notebook
│   ├── rydexa_training_pipeline.ipynb # Self-contained Google Colab notebook
│   └── dataset/
│       └── hour.csv            # Official UCI Bike Sharing dataset
├── frontend/                   # Next.js 16 + React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Main application page
│   │   │   └── globals.css     # Apple-inspired aesthetic & electric lime accents
│   │   ├── components/
│   │   │   ├── layout/         # Frosted glass Navbar with live backend health & Footer
│   │   │   ├── hero/           # HeroSection and Three.js 3D kinetic mesh (Hero3D)
│   │   │   ├── studio/         # Interactive Prediction Studio with validation & presets
│   │   │   ├── analytics/      # 24h diurnal, weather, and seasonal empirical charts
│   │   │   ├── metrics/        # Held-out model comparison and scientific disclosures
│   │   │   └── about/          # Architecture layers & commercial roadmap
│   │   └── lib/
│   │       ├── api.ts          # Typed API client with honest error handling
│   │       └── types.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Machine Learning & Evaluation Rigor

### 1. Dataset Provenance
- **Source**: UCI Machine Learning Repository — [Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset).
- **Domain**: Capital Bikeshare system (Washington D.C., years 2011–2012).
- **Records**: 17,379 verified hourly observations.

### 2. Zero-Leakage Feature Engineering
- Target is `cnt` (total hourly rentals).
- Sub-components `casual` and `registered` strictly satisfy `casual + registered == cnt`. They are **strictly excluded** from training and inference to avoid target leakage.
- Features utilized:
  - Temporal: `season`, `yr`, `mnth`, `hr`, `holiday`, `weekday`, `workingday`
  - Weather: `weathersit` (1–4), `temp` (normalized Celsius), `atemp` (feeling temp), `hum` (humidity %), `windspeed` (km/h)
  - Engineered: Cyclical hour & month features ($\sin, \cos$), commuter rush hour interaction (`is_commute_peak`), severe weather indicator (`is_adverse_weather`), thermal discomfort index (`temp_discomfort`).

### 3. Chronological Evaluation Split
To test realistic future forecasting instead of random shuffling:
- **Training Set**: 2011-01-01 to 2012-09-30 (15,211 hours / ~85%)
- **Held-Out Test Set**: 2012-10-01 to 2012-12-31 (2,168 hours / ~15%)

### 4. Measured Benchmark Results

| Model | MAE | RMSE | $R^2$ Score | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Historical Median Baseline** (`hr` $\times$ `workingday`) | 80.87 | 120.39 | 64.33% | Baseline |
| **Ridge Regression** | 87.65 | 116.68 | 66.50% | Evaluated |
| **Random Forest Regressor** (100 trees) | 47.59 | 72.34 | 87.12% | Evaluated |
| **HistGradientBoosting Regressor** | **40.16** | **64.57** | **89.74%** | **Champion Selected** |

---

## Quickstart: Local Setup & Execution

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to the repository root
cd rydexa

# Install Python backend dependencies
pip install -r backend/requirements.txt

# (Optional) Re-train and regenerate artifacts
python ml/train.py

# Start the FastAPI backend server
python backend/run.py
```
The FastAPI backend will start on `http://127.0.0.1:8000`.
- Health check: `http://127.0.0.1:8000/api/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
# In a new terminal, navigate to the frontend directory
cd rydexa/frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google Colab Reproduction

The notebook is a **separate** training environment. Google Colab cannot push files into a running backend, so the hand-off is an explicit ZIP import.

1. Open [Google Colab](https://colab.research.google.com) and upload `ml/rydexa_training_pipeline.ipynb` (also served at `/ml/rydexa_training_pipeline.ipynb` for download from the site).
2. Choose **Runtime → Run all**. Cells 1–7 install dependencies, download the official UCI dataset, make the chronological split, train and compare four models, and write `model.joblib`, `metrics.json`, `feature_schema.json`, and `analytics_summary.json`.
3. Cell 7 bundles them with `shutil.make_archive(...)` into `rydexa_artifacts.zip` and asks Colab to download it.
4. From the repository root, validate and install the archive:

```bash
python backend/import_artifacts.py ~/Downloads/rydexa_artifacts.zip
```

The importer rejects unsafe paths, checks the required files, validates the JSON documents, loads `model.joblib` with joblib, backs up the current `backend/artifacts/` directory, and installs the new set. Use `--check-only` to validate without installing. Restart the backend afterwards:

```bash
python backend/run.py
```

The UI's pipeline card reports only real checks: local backend health and whether the backend loaded its model. It always labels Colab training as external/not connected.

---

## Key API Endpoints

- `GET /api/health`: Service status, loaded model name, and version.
- `POST /api/predict`: Validates physical inputs, computes demand prediction, confidence bounds, and factor explanations.
- `GET /api/model-metrics`: Returns held-out test evaluation benchmarks.
- `GET /api/analytics`: Precomputed aggregations from 17,379 dataset records (diurnal curves, weather impact, seasonal totals).

---

## Disclosures & Scope
- **Dataset Context**: The dataset represents Capital Bikeshare in Washington D.C. (2011–2012). It models behavioral demand under meteorological and calendar variations.
- **Modern Fleets**: Commercial dockless or GPS-geofenced fleets require calibration against real-time telemetry.
- **Integrity Guarantee**: All analytical charts and metrics are computed directly from real observations. If the backend is unreachable, the UI reports an honest error without fabricating synthetic values.

---

## Contact Form Delivery

Copy `frontend/.env.example` to `frontend/.env.local` and set only the channels you actually use. The form shows the success dialog **only after a channel has genuinely accepted the message**; it never fakes delivery.

Channels are tried in order:

1. `CONTACT_WEBHOOK_URL` - any POST endpoint (Make, Zapier, n8n, Formspree, CRM). Optionally authenticated with `CONTACT_WEBHOOK_SECRET`.
2. `RESEND_API_KEY` + `CONTACT_TO_EMAIL` - transactional email via the Resend HTTPS API (no extra npm dependency).
3. Local durable inbox - `frontend/.data/leads.jsonl`. Read it with `npm run leads`.

Other public settings:

- `NEXT_PUBLIC_INSTAGRAM_URL` - footer Instagram link (renders only when set).
- `NEXT_PUBLIC_CONTACT_EMAIL` - published email address / default Resend recipient.
- `CONTACT_STORE_DIR` - override the inbox directory for deployments that cannot write to the project folder.

The local inbox is a real fallback for self-hosted deployments. On read-only/serverless filesystems, configure channel 1 or 2 so leads are not lost.