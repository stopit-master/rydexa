import { PredictionRequest, PredictionResponse, ModelMetricsResponse, AnalyticsSummary, HealthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new ApiError(`Health check failed with status: ${res.status}`, res.status);
    }
    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || 'Unable to establish connection to the FastAPI backend.');
  }
}

export async function predictDemand(payload: PredictionRequest): Promise<PredictionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMsg = `Inference failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = Array.isArray(errorData.detail)
            ? errorData.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
            : errorData.detail;
        }
      } catch {
        // Fallback to text status
      }
      throw new ApiError(errorMsg, res.status);
    }

    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || 'Connection error: Unable to reach inference server.');
  }
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model-metrics`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new ApiError(`Failed to fetch model metrics (status ${res.status})`, res.status);
    }

    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || 'Could not load held-out evaluation metrics from server.');
  }
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new ApiError(`Failed to fetch historical analytics (status ${res.status})`, res.status);
    }

    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || 'Could not load dataset analytics from server.');
  }
}
