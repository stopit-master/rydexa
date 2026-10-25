export interface PredictionRequest {
  hour: number;
  season: number;
  month: number;
  weekday: number;
  workingday: number;
  holiday: number;
  weather_condition: number;
  temperature_c: number;
  feeling_temperature_c?: number;
  humidity_pct: number;
  wind_speed_kmh: number;
}

export interface DemandFactors {
  is_commute_peak: boolean;
  weather_impact: string;
  temperature_rating: string;
  cyclical_phase: string;
}

export interface PredictionResponse {
  predicted_demand: number;
  demand_tier: string;
  confidence_interval: {
    lower_bound: number;
    upper_bound: number;
  };
  factors: DemandFactors;
  model_name: string;
  disclaimer: string;
}

export interface ModelComparison {
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  is_champion: boolean;
}

export interface ModelMetricsResponse {
  dataset_name: string;
  source_url: string;
  historical_context: string;
  split_strategy: string;
  training_samples: number;
  test_samples: number;
  target: string;
  champion_model: string;
  champion_metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  models_evaluated: ModelComparison[];
  disclosures: string[];
}

export interface AnalyticsSummary {
  dataset_summary: {
    total_records: number;
    time_range: string;
    total_rentals: number;
    mean_hourly_rentals: number;
    median_hourly_rentals: number;
    max_hourly_rentals: number;
    std_hourly_rentals: number;
  };
  hourly_pattern: Array<{
    hour: number;
    workingday_avg: number;
    non_workingday_avg: number;
    overall_avg: number;
  }>;
  season_pattern: Array<{
    season_id: number;
    season_name: string;
    mean_hourly: number;
    median_hourly: number;
    total_rentals: number;
  }>;
  weather_pattern: Array<{
    weathersit_id: number;
    weather_name: string;
    mean_hourly: number;
    sample_count: number;
  }>;
  temperature_pattern: Array<{
    temp_range: string;
    mean_hourly: number;
    sample_count: number;
  }>;
}

export interface HealthResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  champion_model: string;
  version: string;
}
