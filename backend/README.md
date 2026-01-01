# MeshScope Backend

FastAPIベースのバックエンドAPI

## セットアップ

### 1. 依存関係のインストール

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集:

```env
ESTAT_API_KEY=your_estat_api_key_here
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:5173
```

### 3. サーバーの起動

```bash
python main.py
# または
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API エンドポイント

### GET `/`

ヘルスチェック

**レスポンス**:
```json
{
  "message": "MeshScope API is running",
  "version": "1.0.0",
  "estat_enabled": true
}
```

### POST `/api/mesh/statistics`

座標からメッシュ統計を取得

**リクエスト**:
```json
{
  "lat": 35.6812,
  "lon": 139.7671
}
```

**レスポンス**:
```json
{
  "mesh_code": "5339356234",
  "population": 150,
  "businesses": 25,
  "livability_index": {
    "convenience": 83.33,
    "livability": 90.0,
    "diversity": 85.71,
    "overall": 86.35
  },
  "geojson": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [...]
    },
    "properties": {
      "mesh_code": "5339356234",
      "population": 150,
      "businesses": 25,
      "livability_index": {...}
    }
  }
}
```

### GET `/api/mesh/{mesh_code}`

メッシュコードからメッシュ情報を取得

**パラメータ**:
- `mesh_code`: 500mメッシュコード（10桁）

**レスポンス**:
```json
{
  "mesh_code": "5339356234",
  "center": {
    "lat": 35.6812,
    "lon": 139.7671
  },
  "geojson": {
    "type": "Feature",
    "geometry": {...},
    "properties": {...}
  }
}
```

## メッシュコード変換

### JIS X 0410規格

500mメッシュコードは以下の構造を持つ10桁のコード:

```
PPUUQVRSUW
│││││││││└─ 4次メッシュ経度 (W)
││││││││└── 4次メッシュ緯度 (T)
│││││││└─── 3次メッシュ経度 (S)
││││││└──── 3次メッシュ緯度 (R)
│││││└───── 2次メッシュ経度 (V)
││││└────── 2次メッシュ緯度 (Q)
││└└─────── 1次メッシュ経度 (UU)
└└────────── 1次メッシュ緯度 (PP)
```

### 使用例

```python
from mesh_utils import latlon_to_mesh_500m, mesh_500m_to_polygon

# 緯度経度からメッシュコードを取得
mesh_code = latlon_to_mesh_500m(35.6812, 139.7671)
print(mesh_code)  # "5339356234"

# メッシュコードからGeoJSONポリゴンを生成
geojson = mesh_500m_to_polygon(mesh_code)
```

## e-Stat API クライアント

### 使用例

```python
from estat_client import EStatClient

client = EStatClient(api_key="your_api_key")

# メッシュ統計の取得
stats = await client.get_mesh_statistics("5339356234")
print(stats)
# {
#   "mesh_code": "5339356234",
#   "population": 150,
#   "businesses": 25
# }
```

## 生活完結指数の計算

### 利便性 (Convenience)

事業所密度に基づく指標:
- 事業所数が10以上で100点
- 0事業所で0点

### 居住性 (Livability)

適度な人口密度:
- 50-200人: 高評価 (70-100点)
- 50人未満: 人口に比例 (0-70点)
- 200人超: 過密として減点

### 多様性 (Diversity)

人口と事業所のバランス:
- 1人あたり0.05-0.2事業所: 最適 (100点)
- それ以外: 比率に応じて減点

### 総合スコア

3つの指標の平均値

## デプロイ

### Render

1. Renderでアカウント作成
2. New Web Serviceを選択
3. リポジトリを接続
4. 設定:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 環境変数を設定

### Railway

```bash
railway login
railway init
railway up
```

環境変数を設定:
```bash
railway variables set ESTAT_API_KEY=your_key
railway variables set ALLOWED_ORIGINS=https://yourusername.github.io
```

## トラブルシューティング

### e-Stat APIキーが無い場合

APIキーが設定されていない場合、モックデータが使用されます。

### CORSエラー

`ALLOWED_ORIGINS`環境変数にフロントエンドのURLが含まれているか確認してください。

### データが取得できない

- e-Stat APIキーが正しいか確認
- `statsDataId`が正しいか確認（実際のe-Statデータに合わせて調整が必要）
