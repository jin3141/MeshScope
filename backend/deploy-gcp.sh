#!/bin/bash
# GCP Cloud Runへのデプロイスクリプト
# 課金を最小限に抑える設定を含む

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== MeshScope Backend - GCP Cloud Run デプロイ ===${NC}"
echo ""

# 環境変数チェック
if [ -z "$GCP_PROJECT_ID" ]; then
  echo -e "${RED}エラー: GCP_PROJECT_ID 環境変数が設定されていません${NC}"
  echo "以下のコマンドで設定してください:"
  echo "  export GCP_PROJECT_ID=your-project-id"
  exit 1
fi

if [ -z "$GITHUB_PAGES_URL" ]; then
  echo -e "${YELLOW}警告: GITHUB_PAGES_URL が設定されていません${NC}"
  echo "デフォルト値を使用します（後で変更できます）"
  GITHUB_PAGES_URL="https://yourusername.github.io"
fi

# リージョン設定（東京リージョン推奨）
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="meshscope-api"

echo -e "${GREEN}設定:${NC}"
echo "  プロジェクトID: $GCP_PROJECT_ID"
echo "  リージョン: $REGION"
echo "  サービス名: $SERVICE_NAME"
echo "  許可するオリジン: $GITHUB_PAGES_URL"
echo ""

# gcloud設定
echo -e "${YELLOW}gcloud プロジェクトを設定中...${NC}"
gcloud config set project $GCP_PROJECT_ID

# Cloud Run APIを有効化
echo -e "${YELLOW}必要なAPIを有効化中...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# e-Stat APIキーをSecret Managerに保存（まだ保存していない場合）
if [ ! -z "$ESTAT_API_KEY" ]; then
  echo -e "${YELLOW}e-Stat APIキーをSecret Managerに保存中...${NC}"
  echo -n "$ESTAT_API_KEY" | gcloud secrets create estat-api-key \
    --data-file=- \
    --replication-policy="automatic" 2>/dev/null || \
  echo -n "$ESTAT_API_KEY" | gcloud secrets versions add estat-api-key \
    --data-file=-
fi

# デプロイ
echo -e "${YELLOW}Cloud Runにデプロイ中...${NC}"
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "ALLOWED_ORIGINS=$GITHUB_PAGES_URL,http://localhost:5173" \
  --update-secrets "ESTAT_API_KEY=estat-api-key:latest" \
  --min-instances 0 \
  --max-instances 1 \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60s \
  --cpu-throttling \
  --no-cpu-boost

# デプロイ完了
echo ""
echo -e "${GREEN}=== デプロイ完了！ ===${NC}"
echo ""

# サービスURLを取得
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo -e "${GREEN}サービスURL:${NC} $SERVICE_URL"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "1. フロントエンドの .env.production を以下のように更新:"
echo "   VITE_API_URL=$SERVICE_URL"
echo ""
echo "2. 課金を監視:"
echo "   https://console.cloud.google.com/billing"
echo ""
echo "3. 予算アラートを設定（推奨）:"
echo "   https://console.cloud.google.com/billing/budgets"
echo "   推奨: \$1 の予算アラートを設定"
echo ""
echo -e "${YELLOW}無料枠の制限:${NC}"
echo "  - 月間 2,000,000 リクエスト"
echo "  - 360,000 GB秒のメモリ"
echo "  - 180,000 vCPU秒"
echo "  - 1GB のネットワーク下り（北米）"
echo ""
