"""
メッシュコード変換ユーティリティ
JIS X 0410 に基づく500mメッシュコードの計算
"""
import math
from typing import Tuple, Dict


def latlon_to_mesh_500m(lat: float, lon: float) -> str:
    """
    緯度経度から500mメッシュコードを計算

    Args:
        lat: 緯度
        lon: 経度

    Returns:
        500mメッシュコード（文字列）
    """
    # 1次メッシュ (約80km四方)
    p = int(lat * 1.5)
    u = int(lon - 100)

    # 2次メッシュ (約10km四方)
    lat_rem = lat * 1.5 - p
    lon_rem = lon - 100 - u

    q = int(lat_rem * 8)
    v = int(lon_rem * 8)

    # 3次メッシュ (約1km四方)
    lat_rem2 = lat_rem * 8 - q
    lon_rem2 = lon_rem * 8 - v

    r = int(lat_rem2 * 10)
    s = int(lon_rem2 * 10)

    # 4次メッシュ (500m四方)
    lat_rem3 = lat_rem2 * 10 - r
    lon_rem3 = lon_rem2 * 10 - s

    t = int(lat_rem3 * 2)
    w = int(lon_rem3 * 2)

    # メッシュコード生成: 1次(4桁) + 2次(2桁) + 3次(2桁) + 4次(2桁)
    mesh_code = f"{p:02d}{u:02d}{q}{v}{r}{s}{t}{w}"

    return mesh_code


def mesh_500m_to_polygon(mesh_code: str) -> Dict:
    """
    500mメッシュコードからGeoJSONポリゴンを生成

    Args:
        mesh_code: 500mメッシュコード（10桁）

    Returns:
        GeoJSON Feature オブジェクト
    """
    if len(mesh_code) != 10:
        raise ValueError(f"Invalid mesh code length: {len(mesh_code)}, expected 10")

    # メッシュコードを分解
    p = int(mesh_code[0:2])
    u = int(mesh_code[2:4])
    q = int(mesh_code[4])
    v = int(mesh_code[5])
    r = int(mesh_code[6])
    s = int(mesh_code[7])
    t = int(mesh_code[8])
    w = int(mesh_code[9])

    # 南西角の緯度経度を計算
    lat_sw = p / 1.5 + q / 12.0 + r / 120.0 + t / 240.0
    lon_sw = u + 100 + v / 8.0 + s / 80.0 + w / 160.0

    # 500mメッシュのサイズ
    lat_size = 1.0 / 240.0  # 約500m
    lon_size = 1.0 / 160.0  # 約500m

    # 4角の座標
    coords = [
        [lon_sw, lat_sw],                           # 南西
        [lon_sw + lon_size, lat_sw],                # 南東
        [lon_sw + lon_size, lat_sw + lat_size],     # 北東
        [lon_sw, lat_sw + lat_size],                # 北西
        [lon_sw, lat_sw]                            # 閉じる
    ]

    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords]
        },
        "properties": {
            "mesh_code": mesh_code
        }
    }


def mesh_500m_to_center(mesh_code: str) -> Tuple[float, float]:
    """
    500mメッシュコードから中心座標を取得

    Args:
        mesh_code: 500mメッシュコード（10桁）

    Returns:
        (緯度, 経度) のタプル
    """
    polygon = mesh_500m_to_polygon(mesh_code)
    coords = polygon["geometry"]["coordinates"][0]

    # 中心座標を計算（対角線の交点）
    lat = (coords[0][1] + coords[2][1]) / 2
    lon = (coords[0][0] + coords[2][0]) / 2

    return lat, lon
