/**
 * モックデータ生成ユーティリティ
 */
import type { MeshStatistics } from './types';

/**
 * 緯度経度から簡易的にメッシュコードを生成（モック用）
 */
function generateMockMeshCode(lat: number, lon: number): string {
  const p = Math.floor(lat * 1.5);
  const u = Math.floor(lon - 100);
  const q = Math.floor((lat * 1.5 - p) * 8);
  const v = Math.floor((lon - 100 - u) * 8);
  const r = Math.floor(((lat * 1.5 - p) * 8 - q) * 10);
  const s = Math.floor(((lon - 100 - u) * 8 - v) * 10);
  const t = Math.floor((((lat * 1.5 - p) * 8 - q) * 10 - r) * 2);
  const w = Math.floor((((lon - 100 - u) * 8 - v) * 10 - s) * 2);

  return `${p.toString().padStart(2, '0')}${u.toString().padStart(2, '0')}${q}${v}${r}${s}${t}${w}`;
}

/**
 * メッシュコードからGeoJSONポリゴンを生成（モック用）
 */
function generateMockPolygon(lat: number, lon: number, meshCode: string): GeoJSON.Feature<GeoJSON.Polygon> {
  const latSize = 1.0 / 240.0;
  const lonSize = 1.0 / 160.0;

  const latSW = Math.floor(lat / latSize) * latSize;
  const lonSW = Math.floor(lon / lonSize) * lonSize;

  const coords = [
    [lonSW, latSW],
    [lonSW + lonSize, latSW],
    [lonSW + lonSize, latSW + latSize],
    [lonSW, latSW + latSize],
    [lonSW, latSW]
  ];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    },
    properties: {
      mesh_code: meshCode
    }
  };
}

/**
 * ランダムなモックデータを生成
 */
export function generateMockStatistics(lat: number, lon: number): MeshStatistics {
  const meshCode = generateMockMeshCode(lat, lon);

  // ランダムな統計データ生成（位置に基づいてシード化）
  const seed = lat * 1000 + lon * 100;
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    const r = x - Math.floor(x);
    return Math.floor(min + r * (max - min));
  };

  const population = random(0, 300);
  const businesses = random(0, 30);

  // 生活完結指数の計算
  const convenience = Math.min(100, (businesses / 10) * 100);

  let livability: number;
  if (population === 0) {
    livability = 0;
  } else if (population < 50) {
    livability = (population / 50) * 70;
  } else if (population <= 200) {
    livability = 70 + ((population - 50) / 150) * 30;
  } else {
    livability = Math.max(0, 100 - ((population - 200) / 100) * 10);
  }

  let diversity: number;
  if (population > 0 && businesses > 0) {
    const ratio = businesses / population;
    if (0.05 <= ratio && ratio <= 0.2) {
      diversity = 100;
    } else if (ratio < 0.05) {
      diversity = (ratio / 0.05) * 100;
    } else {
      diversity = Math.max(0, 100 - ((ratio - 0.2) / 0.1) * 30);
    }
  } else {
    diversity = 0;
  }

  const livability_index = {
    convenience: Math.round(convenience * 100) / 100,
    livability: Math.round(livability * 100) / 100,
    diversity: Math.round(diversity * 100) / 100,
    overall: Math.round((convenience + livability + diversity) / 3 * 100) / 100
  };

  const geojson = generateMockPolygon(lat, lon, meshCode);
  geojson.properties = {
    ...geojson.properties,
    population,
    businesses,
    livability_index
  };

  return {
    mesh_code: meshCode,
    population,
    businesses,
    livability_index,
    geojson
  };
}
