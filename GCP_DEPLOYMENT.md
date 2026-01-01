# GCP Cloud Run デプロイ手順（課金を最小限に抑える設定）

このガイドでは、MeshScope バックエンドを **GCP Cloud Run** にデプロイする手順を説明します。

## ⚠️ 重要：課金に関する注意事項

### 無料枠の制限（月間）

Cloud Runの無料枠:
- **2,000,000** リクエスト
- **360,000 GB秒** のメモリ使用
- **180,000 vCPU秒** の CPU使用
- **1GB** のネットワーク下り（北米）

### 課金を最小限に抑える設定

このプロジェクトでは以下の設定を適用しています：

✅ **minScale: 0** - 使用されていない時はインスタンスが完全に停止（課金ゼロ）
✅ **maxScale: 1** - 最大1インスタンスまで（無料枠超過を防止）
✅ **memory: 256Mi** - 最小メモリ設定
✅ **CPU throttling** - リクエスト処理時のみCPU使用
✅ **timeout: 60s** - 長時間実行を防止

### 予算アラートの設定（必須）

デプロイ前に **必ず予算アラートを設定** してください：

1. [GCP 予算とアラート](https://console.cloud.google.com/billing/budgets) にアクセス
2. 「予算を作成」をクリック
3. 予算額: **$1** （または希望する上限）
4. アラートしきい値: **50%, 90%, 100%**
5. 通知先: メールアドレスを設定

## 📋 前提条件

### 1. Google Cloud アカウントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン
3. 新規プロジェクトを作成

⚠️ **クレジットカード登録が必要です**（無料枠でも必須）

### 2. Google Cloud SDK（gcloud）のインストール

#### macOS:
```bash
brew install --cask google-cloud-sdk
```

#### Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows:
[インストーラー](https://cloud.google.com/sdk/docs/install)をダウンロードして実行

### 3. gcloud の初期化

```bash
gcloud init
```

ログインして、プロジェクトを選択します。

### 4. e-Stat APIキーの取得

1. [e-Stat](https://www.e-stat.go.jp/) でユーザー登録
2. APIキーを取得
3. 環境変数に設定:
   ```bash
   export ESTAT_API_KEY="your_api_key_here"
   ```

## 🚀 デプロイ手順

### ステップ1: 環境変数の設定

```bash
cd backend

# GCPプロジェクトID（GCPコンソールで確認）
export GCP_PROJECT_ID="your-project-id"

# GitHub PagesのURL（後でフロントエンドをデプロイするURL）
export GITHUB_PAGES_URL="https://yourusername.github.io"

# e-Stat APIキー
export ESTAT_API_KEY="your_estat_api_key"

# リージョン（オプション、デフォルト: asia-northeast1 東京）
export GCP_REGION="asia-northeast1"
```

### ステップ2: デプロイスクリプトの実行

```bash
./deploy-gcp.sh
```

このスクリプトは以下を実行します：
1. 必要なGCP APIの有効化
2. e-Stat APIキーをSecret Managerに保存
3. Cloud Runにアプリケーションをデプロイ

### ステップ3: デプロイ完了の確認

デプロイが完了すると、サービスURLが表示されます：

```
サービスURL: https://meshscope-api-XXXXX-an.a.run.app
```

このURLをメモしてください。

### ステップ4: フロントエンドの設定

1. フロントエンドの `.env.production` を編集:

```bash
cd ../frontend
nano .env.production
```

2. APIのURLを更新:

```env
VITE_API_URL=https://meshscope-api-XXXXX-an.a.run.app
```

3. 変更をコミット・プッシュ:

```bash
git add .env.production
git commit -m "Update production API URL"
git push
```

GitHub Actionsが自動的にフロントエンドをデプロイします。

### ステップ5: 動作確認

1. GitHub Pagesを開く: `https://yourusername.github.io/MeshScope/`
2. 地図をクリックしてメッシュ統計が表示されるか確認

## 🔍 デプロイ後の確認

### サービスの状態確認

```bash
gcloud run services describe meshscope-api \
  --region asia-northeast1 \
  --format yaml
```

### ログの確認

```bash
gcloud run services logs read meshscope-api \
  --region asia-northeast1 \
  --limit 50
```

### 課金状況の確認

[GCP 課金ダッシュボード](https://console.cloud.google.com/billing) で使用状況を確認できます。

## 💰 課金を抑えるためのベストプラクティス

### 1. 定期的な監視

- 週1回は[課金ダッシュボード](https://console.cloud.google.com/billing)を確認
- 予算アラートのメールを必ずチェック

### 2. 不要な時はサービスを停止

```bash
# サービスの削除（課金完全停止）
gcloud run services delete meshscope-api \
  --region asia-northeast1
```

### 3. リクエスト数の制限

無料枠: 月間 2,000,000 リクエスト

- 1日あたり約 66,000 リクエストまで無料
- アクセスが少ない場合は問題なし

### 4. メモリ使用量の監視

現在の設定: 256Mi（最小）

この設定であれば、通常の使用では無料枠内に収まります。

## 🛠️ トラブルシューティング

### デプロイエラー

**エラー: "API not enabled"**

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

**エラー: "Permission denied"**

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### CORS エラー

フロントエンドからAPIにアクセスできない場合:

1. バックエンドの環境変数を確認:

```bash
gcloud run services describe meshscope-api \
  --region asia-northeast1 \
  --format 'value(spec.template.spec.containers[0].env)'
```

2. `ALLOWED_ORIGINS` に正しいURLが設定されているか確認

3. 修正して再デプロイ:

```bash
gcloud run services update meshscope-api \
  --region asia-northeast1 \
  --set-env-vars "ALLOWED_ORIGINS=https://yourusername.github.io"
```

### APIキーエラー

e-Stat APIキーが正しく設定されていない場合:

```bash
# シークレットの更新
echo -n "your_new_api_key" | gcloud secrets versions add estat-api-key --data-file=-

# サービスの再デプロイ（シークレットを再読み込み）
gcloud run services update meshscope-api --region asia-northeast1
```

## 📊 費用見積もり

### 無料枠内での使用例

**想定：**
- 1日 100 リクエスト
- 1リクエストあたり平均 0.5秒

**計算：**
- 月間リクエスト数: 100 × 30 = 3,000 リクエスト ✅ 無料枠内
- メモリ使用: 0.256GB × 0.5秒 × 3,000 = 384 GB秒 ✅ 無料枠内
- CPU使用: 1 vCPU × 0.5秒 × 3,000 = 1,500 vCPU秒 ✅ 無料枠内

**結論:** このレベルの使用であれば **完全無料** です。

### 無料枠を超えた場合の課金例

仮に無料枠を超えた場合（月間 100,000 リクエスト）:

- 超過分: 98,000 リクエスト
- 料金: $0.40 per 1M requests × 0.098M = **約 $0.04**

メモリ・CPU使用料も同様に非常に低額です。

## 🔒 セキュリティ対策

### 1. シークレットの管理

- APIキーは **Secret Manager** に保存（環境変数に直接書かない）
- `.env` ファイルを `.gitignore` に追加済み

### 2. CORS設定

- `ALLOWED_ORIGINS` で許可するドメインを制限
- デフォルトで GitHub PagesのURLのみ許可

### 3. レート制限（オプション）

大量のリクエストを防ぐため、Cloud Armorでレート制限を設定可能（有料）

## 📚 参考リンク

- [Cloud Run 公式ドキュメント](https://cloud.google.com/run/docs)
- [Cloud Run 料金](https://cloud.google.com/run/pricing)
- [無料枠の詳細](https://cloud.google.com/free/docs/gcp-free-tier)
- [予算アラートの設定](https://cloud.google.com/billing/docs/how-to/budgets)

## ❓ よくある質問

**Q: 本当に無料で使えますか？**

A: 無料枠内であれば完全無料です。ただし、以下の条件を満たす必要があります：
- 月間リクエスト数が 200万以下
- 適切な設定（minScale: 0, メモリ: 256Mi など）
- 予算アラートを設定して監視

**Q: クレジットカードを登録しないといけないのですか？**

A: はい、GCPは無料枠でもクレジットカード登録が必須です。ただし、無料枠内であれば課金されません。

**Q: 勝手に課金される心配はありませんか？**

A: 予算アラートを設定すれば、設定額を超えそうになったらメールで通知されます。また、minScale: 0 の設定により、使用されていない時は完全に停止するため、予期しない課金は防げます。

**Q: サービスを完全に停止するには？**

A: 以下のコマンドでサービスを削除できます：
```bash
gcloud run services delete meshscope-api --region asia-northeast1
```

**Q: もっと安く（または完全無料で）デプロイできませんか？**

A: クレジットカード登録不要の選択肢として、Vercelの無料プランがあります。ただし、Vercel はServerless Functionsの制限が厳しいため、用途によって選択してください。
