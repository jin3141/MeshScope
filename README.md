# MeshScope

500mメッシュ単位で「生活のしやすさ」を可視化するWebアプリケーション

## 概要

MeshScopeは、e-Stat（政府統計の総合窓口）のデータを活用し、日本全国を500mメッシュ単位で分析し、各地域の「生活完結指数」を可視化するアプリケーションです。

### 主な機能

- **インタラクティブマップ**: 地図をクリックして500mメッシュの統計情報を表示
- **生活完結指数**: 利便性・居住性・多様性の3つの指標で地域を評価
- **リアルタイム分析**: e-Stat APIから最新の統計データを取得

### 生活完結指数について

- **利便性**: 事業所密度に基づく商業施設の充実度
- **居住性**: 適度な人口密度（過疎・過密を避けた快適な居住環境）
- **多様性**: 人口と事業所のバランスによる地域の多様性

## 技術スタック

### フロントエンド

- **Vite + React** (TypeScript)
- **Tailwind CSS**: スタイリング
- **MapLibre GL JS**: 地図表示とGeoJSON可視化
- **GitHub Pages**: ホスティング

### バックエンド

- **FastAPI** (Python): REST API
- **HTTPX**: HTTP通信
- **e-Stat API**: 政府統計データの取得
- **推奨ホスティング**: Render / Railway / Vercel

## プロジェクト構成

```
MeshScope/
├── frontend/           # フロントエンド (Vite + React)
│   ├── src/
│   │   ├── components/ # Reactコンポーネント
│   │   ├── types.ts    # TypeScript型定義
│   │   ├── api.ts      # APIクライアント
│   │   └── App.tsx     # メインアプリケーション
│   ├── .env.development    # 開発環境変数
│   ├── .env.production     # 本番環境変数
│   └── vite.config.ts      # Vite設定
│
├── backend/            # バックエンド (FastAPI)
│   ├── main.py         # FastAPIアプリケーション
│   ├── mesh_utils.py   # メッシュコード変換
│   ├── estat_client.py # e-Stat APIクライアント
│   ├── requirements.txt
│   └── .env.example    # 環境変数サンプル
│
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actionsデプロイ設定
```

## セットアップ

### 1. バックエンドのセットアップ

```bash
cd backend

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .env ファイルを編集してe-Stat APIキーを設定
```

#### e-Stat APIキーの取得

1. [e-Stat](https://www.e-stat.go.jp/)にアクセス
2. ユーザー登録を行う
3. APIキーを取得
4. `.env`ファイルの`ESTAT_API_KEY`に設定

```env
ESTAT_API_KEY=your_api_key_here
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:5173
```

#### バックエンドの起動

```bash
cd backend
python main.py
# または
uvicorn main:app --reload
```

APIは `http://localhost:8000` で起動します。

### 2. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

アプリは `http://localhost:5173` で起動します。

### 3. 環境変数の設定

#### フロントエンド

`frontend/.env.production` を編集し、バックエンドのURLを設定：

```env
VITE_API_URL=https://your-backend-api.onrender.com
```

#### Vite設定の更新

`frontend/vite.config.ts` の `base` パラメータをリポジトリ名に合わせて変更：

```typescript
base: process.env.NODE_ENV === 'production' ? '/MeshScope/' : '/',
```

## デプロイ

### バックエンドのデプロイ (Render)

1. [Render](https://render.com/)でアカウント作成
2. 新しいWeb Serviceを作成
3. GitHubリポジトリを接続
4. 設定:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 環境変数を設定:
   - `ESTAT_API_KEY`: e-Stat APIキー
   - `ALLOWED_ORIGINS`: フロントエンドのURL（例: `https://yourusername.github.io`）

### フロントエンドのデプロイ (GitHub Pages)

1. GitHubリポジトリの Settings > Pages に移動
2. Source: **GitHub Actions** を選択
3. `frontend/.env.production` でバックエンドURLを設定
4. コードをpush:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

GitHub Actionsが自動的にビルド・デプロイを実行します。

## 開発

### ローカル開発の流れ

1. バックエンドを起動 (`http://localhost:8000`)
2. フロントエンドを起動 (`http://localhost:5173`)
3. ブラウザでアプリを開く
4. 地図をクリックしてメッシュ統計を表示

### API仕様

#### POST `/api/mesh/statistics`

緯度経度からメッシュ統計を取得

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
    "geometry": { ... },
    "properties": { ... }
  }
}
```

## 注意事項

### e-Stat API

- APIキーは**必ずバックエンド側で管理**し、フロントエンドから直接呼び出さないこと
- データセットID (`statsDataId`) は実際のe-Statデータに合わせて調整が必要
- 利用規約を確認し、適切に使用すること

### CORS設定

- GitHub PagesとバックエンドAPI間の通信には適切なCORS設定が必要
- バックエンドの `ALLOWED_ORIGINS` に必ずフロントエンドのURLを追加

### HTTPS

- GitHub PagesはHTTPS通信のため、バックエンドもHTTPS化が必要
- Render等のクラウドプラットフォームはデフォルトでHTTPS対応

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 謝辞

- [e-Stat](https://www.e-stat.go.jp/) - 政府統計データ
- [MapLibre GL JS](https://maplibre.org/) - 地図ライブラリ
- [OpenStreetMap Japan](https://openstreetmap.jp/) - 地図タイル
