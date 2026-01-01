# MeshScope Frontend

Vite + React + TypeScript フロントエンド

## 技術スタック

- **Vite**: ビルドツール
- **React 18**: UIフレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **MapLibre GL JS**: 地図表示

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

開発環境:

```bash
# .env.development (既に設定済み)
VITE_API_URL=http://localhost:8000
```

本番環境:

```bash
# .env.production を編集
VITE_API_URL=https://your-backend-api.onrender.com
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く

### ビルド

```bash
npm run build
```

ビルド結果は `dist/` ディレクトリに出力されます。

### プレビュー

ビルド後のアプリをローカルでプレビュー:

```bash
npm run preview
```

## プロジェクト構造

```
src/
├── components/         # Reactコンポーネント
│   ├── Map.tsx        # MapLibreマップコンポーネント
│   └── StatsPanel.tsx # 統計情報パネル
├── types.ts           # TypeScript型定義
├── api.ts             # APIクライアント
├── App.tsx            # メインアプリケーション
├── main.tsx           # エントリーポイント
└── index.css          # グローバルスタイル
```

## コンポーネント

### Map

MapLibre GL JSを使用した地図コンポーネント

**Props**:
- `onMeshSelect?: (stats: MeshStatistics) => void` - メッシュ選択時のコールバック

**機能**:
- 地図のインタラクティブ表示
- クリックイベントの処理
- GeoJSONポリゴンの重畳表示
- ヒートマップ表示（生活完結指数に基づく色分け）

### StatsPanel

メッシュ統計情報を表示するサイドパネル

**Props**:
- `stats: MeshStatistics | null` - 表示する統計データ

**機能**:
- メッシュコード表示
- 人口・事業所数の表示
- 生活完結指数の可視化（プログレスバー）

## API クライアント

### MeshScopeAPI

バックエンドAPIとの通信を担当

```typescript
import { apiClient } from './api';

// メッシュ統計を取得
const stats = await apiClient.getMeshStatistics(35.6812, 139.7671);

// ヘルスチェック
const health = await apiClient.healthCheck();
```

## GitHub Pages デプロイ

### Vite設定

`vite.config.ts`でベースパスを設定:

```typescript
base: process.env.NODE_ENV === 'production' ? '/MeshScope/' : '/',
```

リポジトリ名に合わせて変更してください。

### 自動デプロイ

`main`ブランチにプッシュすると、GitHub Actionsが自動的にビルド・デプロイを実行します。

### 手動ビルド

```bash
npm run build
```

`dist/`ディレクトリの内容をGitHub Pagesにデプロイします。

## 開発ガイド

### スタイリング

Tailwind CSSユーティリティクラスを使用:

```tsx
<div className="flex flex-col md:flex-row w-screen h-screen">
  <div className="bg-white shadow-lg p-6">
    {/* コンテンツ */}
  </div>
</div>
```

### 型定義

TypeScriptの型は `types.ts` で定義:

```typescript
export interface MeshStatistics {
  mesh_code: string;
  population: number;
  businesses: number;
  livability_index: LivabilityIndex;
  geojson: GeoJSON.Feature<GeoJSON.Polygon>;
}
```

### MapLibre スタイル

OpenStreetMap Japanのタイルを使用:

```typescript
style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json'
```

独自のスタイルを使用する場合は、MapLibre Style Specに従ったJSONを指定してください。

## トラブルシューティング

### CORSエラー

バックエンドの`ALLOWED_ORIGINS`にフロントエンドのURLが含まれているか確認してください。

### マップが表示されない

1. `maplibre-gl.css`が正しくインポートされているか確認
2. コンテナ要素に適切な`width`と`height`が設定されているか確認

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## ライセンス

MIT License
