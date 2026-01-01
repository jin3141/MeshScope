/**
 * MeshScope API クライアント
 */
import type { MeshStatistics, CoordinateRequest } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class MeshScopeAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  async getMeshStatistics(lat: number, lon: number): Promise<MeshStatistics> {
    const request: CoordinateRequest = { lat, lon };

    const response = await fetch(`${this.baseUrl}/api/mesh/statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ message: string; version: string; estat_enabled: boolean }> {
    const response = await fetch(`${this.baseUrl}/`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new MeshScopeAPI();
