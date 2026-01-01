# GCP Cloud Run用 Dockerfile
# 課金を最小限に抑えるため、軽量なPython Slimイメージを使用

FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# 依存関係のインストール（キャッシュ効率化のため先にコピー）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# 非rootユーザーで実行（セキュリティ向上）
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Runが設定する$PORTを使用
ENV PORT=8080

# Uvicornでアプリケーション起動
# --workers 1: メモリ使用量を最小化（無料枠対策）
# --timeout-keep-alive 65: Cloud Runのタイムアウトに合わせる
CMD uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --timeout-keep-alive 65
