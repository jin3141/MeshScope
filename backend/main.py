"""
MeshScope Backend API
FastAPI application for mesh statistics and livability analysis
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
from dotenv import load_dotenv

from mesh_utils import latlon_to_mesh_500m, mesh_500m_to_polygon, mesh_500m_to_center
from estat_client import EStatClient

load_dotenv()

app = FastAPI(
    title="MeshScope API",
    description="API for mesh-based livability statistics",
    version="1.0.0"
)

# CORS設定
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# e-Stat クライアント初期化
try:
    estat_client = EStatClient()
except ValueError as e:
    print(f"Warning: {e}. e-Stat features will use mock data.")
    estat_client = None


class CoordinateRequest(BaseModel):
    """座標リクエストモデル"""
    lat: float
    lon: float


class MeshStatistics(BaseModel):
    """メッシュ統計データモデル"""
    mesh_code: str
    population: int
    businesses: int
    livability_index: Dict[str, float]
    geojson: Dict


def calculate_livability_index(population: int, businesses: int) -> Dict[str, float]:
    """
    生活完結指数を計算

    Args:
        population: 人口
        businesses: 事業所数

    Returns:
        利便性、居住性、多様性の指数
    """
    # 利便性指数: 事業所密度に基づく（0-100）
    convenience = min(100, (businesses / 10) * 100) if businesses > 0 else 0

    # 居住性指数: 人口密度に基づく（適度な人口を高評価）
    # 500mメッシュで50-200人程度を最適とする
    if population == 0:
        livability = 0
    elif population < 50:
        livability = (population / 50) * 70
    elif population <= 200:
        livability = 70 + ((population - 50) / 150) * 30
    else:
        # 過密は減点
        livability = max(0, 100 - ((population - 200) / 100) * 10)

    # 多様性指数: 人口と事業所のバランス
    if population > 0 and businesses > 0:
        ratio = businesses / population
        # 1人あたり0.05-0.2の事業所を最適とする
        if 0.05 <= ratio <= 0.2:
            diversity = 100
        elif ratio < 0.05:
            diversity = (ratio / 0.05) * 100
        else:
            diversity = max(0, 100 - ((ratio - 0.2) / 0.1) * 30)
    else:
        diversity = 0

    return {
        "convenience": round(convenience, 2),
        "livability": round(livability, 2),
        "diversity": round(diversity, 2),
        "overall": round((convenience + livability + diversity) / 3, 2)
    }


@app.get("/")
async def root():
    """ヘルスチェックエンドポイント"""
    return {
        "message": "MeshScope API is running",
        "version": "1.0.0",
        "estat_enabled": estat_client is not None
    }


@app.post("/api/mesh/statistics", response_model=MeshStatistics)
async def get_mesh_statistics(request: CoordinateRequest):
    """
    座標からメッシュ統計を取得

    Args:
        request: 緯度経度を含むリクエスト

    Returns:
        メッシュ統計データ
    """
    try:
        # メッシュコード計算
        mesh_code = latlon_to_mesh_500m(request.lat, request.lon)

        # e-Stat からデータ取得（利用可能な場合）
        if estat_client:
            stats = await estat_client.get_mesh_statistics(mesh_code)
            population = stats["population"]
            businesses = stats["businesses"]
        else:
            # モックデータ（APIキーが未設定の場合）
            import random
            population = random.randint(0, 300)
            businesses = random.randint(0, 30)

        # 生活完結指数を計算
        livability_index = calculate_livability_index(population, businesses)

        # GeoJSONポリゴン生成
        geojson = mesh_500m_to_polygon(mesh_code)
        geojson["properties"].update({
            "population": population,
            "businesses": businesses,
            "livability_index": livability_index
        })

        return {
            "mesh_code": mesh_code,
            "population": population,
            "businesses": businesses,
            "livability_index": livability_index,
            "geojson": geojson
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.get("/api/mesh/{mesh_code}")
async def get_mesh_info(mesh_code: str):
    """
    メッシュコードからメッシュ情報を取得

    Args:
        mesh_code: 500mメッシュコード

    Returns:
        メッシュ情報
    """
    try:
        if len(mesh_code) != 10:
            raise HTTPException(status_code=400, detail="Invalid mesh code length")

        # GeoJSONポリゴン生成
        geojson = mesh_500m_to_polygon(mesh_code)

        # 中心座標取得
        lat, lon = mesh_500m_to_center(mesh_code)

        return {
            "mesh_code": mesh_code,
            "center": {"lat": lat, "lon": lon},
            "geojson": geojson
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
