"""
e-Stat API クライアント
"""
import httpx
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class EStatClient:
    """e-Stat API クライアント"""

    BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: e-Stat APIキー（環境変数ESTAT_API_KEYから取得可能）
        """
        self.api_key = api_key or os.getenv("ESTAT_API_KEY")
        if not self.api_key:
            raise ValueError("e-Stat API key is required")

    async def get_population_data(self, mesh_code: str) -> Optional[Dict]:
        """
        国勢調査の人口データを取得

        Args:
            mesh_code: メッシュコード

        Returns:
            人口データ辞書、またはNone
        """
        # 国勢調査 500mメッシュ 人口データ
        # statsDataId は実際のe-Statデータセットに合わせて調整が必要
        stats_data_id = "0003410379"  # 令和2年国勢調査 500mメッシュ例

        params = {
            "appId": self.api_key,
            "statsDataId": stats_data_id,
            "cdArea": mesh_code,
            "metaGetFlg": "N",
            "cntGetFlg": "N",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                # データが存在する場合
                if "GET_STATS_DATA" in data and "STATISTICAL_DATA" in data["GET_STATS_DATA"]:
                    stat_data = data["GET_STATS_DATA"]["STATISTICAL_DATA"]
                    if "DATA_INF" in stat_data and "VALUE" in stat_data["DATA_INF"]:
                        values = stat_data["DATA_INF"]["VALUE"]
                        if values:
                            # 総人口を抽出（実際のデータ構造に応じて調整）
                            population = int(values[0].get("$", 0))
                            return {"population": population}

                return None

        except Exception as e:
            print(f"Error fetching population data: {e}")
            return None

    async def get_business_data(self, mesh_code: str) -> Optional[Dict]:
        """
        経済センサスの店舗数データを取得

        Args:
            mesh_code: メッシュコード

        Returns:
            店舗データ辞書、またはNone
        """
        # 経済センサス 500mメッシュ 事業所数データ
        stats_data_id = "0003446238"  # 令和3年経済センサス 500mメッシュ例

        params = {
            "appId": self.api_key,
            "statsDataId": stats_data_id,
            "cdArea": mesh_code,
            "metaGetFlg": "N",
            "cntGetFlg": "N",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                # データが存在する場合
                if "GET_STATS_DATA" in data and "STATISTICAL_DATA" in data["GET_STATS_DATA"]:
                    stat_data = data["GET_STATS_DATA"]["STATISTICAL_DATA"]
                    if "DATA_INF" in stat_data and "VALUE" in stat_data["DATA_INF"]:
                        values = stat_data["DATA_INF"]["VALUE"]
                        if values:
                            # 事業所数を抽出
                            businesses = int(values[0].get("$", 0))
                            return {"businesses": businesses}

                return None

        except Exception as e:
            print(f"Error fetching business data: {e}")
            return None

    async def get_mesh_statistics(self, mesh_code: str) -> Dict:
        """
        メッシュの統計データを一括取得

        Args:
            mesh_code: メッシュコード

        Returns:
            統計データ辞書
        """
        population_data = await self.get_population_data(mesh_code)
        business_data = await self.get_business_data(mesh_code)

        return {
            "mesh_code": mesh_code,
            "population": population_data.get("population", 0) if population_data else 0,
            "businesses": business_data.get("businesses", 0) if business_data else 0,
        }
