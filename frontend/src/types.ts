/**
 * MeshScope型定義
 */

export interface LivabilityIndex {
  convenience: number;
  livability: number;
  diversity: number;
  overall: number;
}

export interface MeshStatistics {
  mesh_code: string;
  population: number;
  businesses: number;
  livability_index: LivabilityIndex;
  geojson: GeoJSON.Feature<GeoJSON.Polygon>;
}

export interface CoordinateRequest {
  lat: number;
  lon: number;
}
