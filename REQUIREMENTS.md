---
# 📦 システム要件（Requirements）

このドキュメントでは、開発環境および実行に必要なソフトウェア、外部サービス、最小要件をまとめています。

## 必要なソフトウェア

### 1. Node.js
- **バージョン**: 20.x LTS 以上を推奨
- **ダウンロード**: https://nodejs.org
- **用途**: バックエンドとフロントエンドの実行

### 2. PostgreSQL
- **バージョン**: 15.x 以上を推奨
- **ダウンロード**: https://www.postgresql.org/download/
- **用途**: アカウント、投稿、スケジュール等のデータ格納

### 3. Redis
- **バージョン**: 7.x 以上を推奨
- **インストール方法**:
  - Windows: https://github.com/tporadowski/redis/releases
  - macOS: `brew install redis`
  - Linux: `sudo apt-get install redis-server`
- **用途**: バックグラウンドジョブのキュー処理

### 4. ngrok
- **バージョン**: 最新
- **ダウンロード**: https://ngrok.com/download
- **用途**: 開発環境で公開 URL を作成し、Instagram OAuth コールバックを受けるために使用

---

## npm パッケージ（`npm install` で自動導入）

バックエンド・フロントエンドを `npm install` した際にインストールされる主要な依存ライブラリの例：

### バックエンドの主な依存関係（例）
`@nestjs/*`, `@prisma/client`, `bull`, `redis`, `bcrypt`, `jsonwebtoken`, `axios`, `sharp`, `dotenv` など

### フロントエンドの主な依存関係（例）
`react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `recharts`, `tailwindcss`, `axios` など

（実際のバージョンは `package.json` を参照してください）

---

## 外部サービス（無料プランで利用可能）

### Meta Developer（Facebook）
- **サイト**: https://developers.facebook.com
- **用途**: Instagram Graph API の利用
- **備考**: 本番運用で複数ユーザーをサポートする場合は権限申請（App Review）が必要

### Google Cloud Platform
- **サイト**: https://console.cloud.google.com
- **用途**: Google Drive API / Google Sheets API

### Cloudinary（任意）
- **サイト**: https://cloudinary.com
- **用途**: 画像・動画のホスティング（任意）

---

## 最小システム要件

- **OS**: Windows 10 以降 / macOS 11 以降 / Linux（Ubuntu 20.04 以上）
- **メモリ**: 最小 4 GB（推奨 8 GB）
- **ディスク空き容量**: 最小 2 GB
- **CPU**: 現代的なプロセッサ
- **ネットワーク**: 安定したブロードバンド接続

---

## 使用するポート

以下のポートが使用可能であることを確認してください：

- **3000**: バックエンド API
- **5173**: フロントエンド（Vite）
- **5432**: PostgreSQL
- **6379**: Redis

---

## 推奨されるセットアップ順序

1. Node.js をインストール
2. PostgreSQL をインストール・起動
3. Redis をインストール・起動
4. ngrok をインストール・設定
5. Meta Developer と Google Cloud のプロジェクトを作成
6. `npm install` を backend/frontend で実行
7. データベースマイグレーションとシードを適用（Prisma）
8. `.env` を作成して必要な値を設定

---

詳細は `INSTALLATION.md` を参照してください。
