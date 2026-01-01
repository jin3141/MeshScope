/**
 * MapLibre GL JS マップコンポーネント
 */
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { MeshStatistics } from '../types';
import { apiClient } from '../api';

interface MapProps {
  onMeshSelect?: (stats: MeshStatistics) => void;
}

export function Map({ onMeshSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // マップ初期化
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      center: [139.7671, 35.6812], // 東京駅
      zoom: 13,
    });

    // ナビゲーションコントロール追加
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // マップロード完了時の処理
    map.current.on('load', () => {
      if (!map.current) return;

      // メッシュレイヤー用のソース追加
      map.current.addSource('mesh-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // メッシュポリゴンレイヤー追加
      map.current.addLayer({
        id: 'mesh-layer',
        type: 'fill',
        source: 'mesh-source',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'overall', ['get', 'livability_index']],
            0, '#ff0000',    // 低い: 赤
            50, '#ffff00',   // 中間: 黄色
            100, '#00ff00',  // 高い: 緑
          ],
          'fill-opacity': 0.5,
        },
      });

      // メッシュ境界線レイヤー追加
      map.current.addLayer({
        id: 'mesh-outline',
        type: 'line',
        source: 'mesh-source',
        paint: {
          'line-color': '#000',
          'line-width': 2,
        },
      });
    });

    // クリックイベント
    map.current.on('click', async (e) => {
      if (!map.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const { lng, lat } = e.lngLat;
        const stats = await apiClient.getMeshStatistics(lat, lng);

        // GeoJSONソースを更新
        const source = map.current.getSource('mesh-source') as maplibregl.GeoJSONSource;
        if (source) {
          // 既存のフィーチャーを取得
          const currentData = source._data as GeoJSON.FeatureCollection;
          const existingFeatures = currentData.features || [];

          // 同じメッシュコードのフィーチャーを削除
          const filteredFeatures = existingFeatures.filter(
            (f: GeoJSON.Feature) => f.properties?.mesh_code !== stats.mesh_code
          );

          // 新しいフィーチャーを追加
          source.setData({
            type: 'FeatureCollection',
            features: [...filteredFeatures, stats.geojson],
          });
        }

        // 親コンポーネントに通知
        onMeshSelect?.(stats);
      } catch (err) {
        console.error('Error fetching mesh statistics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    });

    // マウスカーソル変更
    map.current.on('mouseenter', 'mesh-layer', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'mesh-layer', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [onMeshSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          読み込み中...
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          エラー: {error}
        </div>
      )}
    </div>
  );
}
