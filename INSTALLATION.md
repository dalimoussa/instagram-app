---
# 📦 インストールガイド

このガイドでは、開発環境でアプリを動かすために必要なソフトのインストールと初期設定手順を説明します。

## ステップ 1：Node.js をインストール

1. https://nodejs.org から LTS（推奨）をダウンロード
2. インストーラーを実行して指示に従う
3. ターミナルで確認：
```powershell
node --version
# v20.x 以上が推奨
```

## ステップ 2：PostgreSQL をインストール（データベース）

1. https://www.postgresql.org/download/ からインストーラーを取得
2. バージョン 15 以上を推奨
3. インストール時にパスワードやポート（通常 5432）を設定
4. ターミナルで確認：
```powershell
psql --version
# psql (PostgreSQL) 15.x など
```

## ステップ 3：Redis をインストール

### Windows（推奨ビルド）
1. https://github.com/tporadowski/redis/releases から msi をダウンロード
2. インストーラーを実行

### macOS
```bash
brew install redis
brew services start redis
```

### Ubuntu / Debian
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

動作確認：
```bash
redis-cli ping
# PONG が返れば OK
```

## ステップ 4：Ngrok をインストール（Instagram OAuth 用）

1. https://ngrok.com にサインアップしてダウンロード
2. インストール後に認証トークンを設定：
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

## ステップ 5：プロジェクト依存パッケージをインストール

```powershell
# 作業ディレクトリへ移動
cd "c:\Users\medal\Downloads\New folder JP"

# backend の依存関係をインストール
cd backend
npm install

# frontend の依存関係をインストール
cd ../frontend
npm install
```

## ステップ 6：データベースの準備

```powershell
# backend フォルダへ
cd backend

# psql でデータベースを作成
psql -U postgres
CREATE DATABASE instagram_autoposter;
\q

# Prisma マイグレーションを適用
npx prisma migrate deploy

# 任意：シードデータを追加
npx prisma db seed
```

## ステップ 7：環境変数ファイルを作成

### backend 用（`backend/.env`）
以下のようなファイルを作成し、実際の値に置き換えてください：

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/instagram_autoposter"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT
JWT_SECRET="ランダムな長い文字列を設定してください"
JWT_EXPIRES_IN="3600"

# Meta / Instagram
META_APP_ID="あなたの_APP_ID"
META_APP_SECRET="あなたの_APP_SECRET"
META_REDIRECT_URI="http://localhost:3000/api/v1/auth/instagram/callback"

# Google
GOOGLE_CLIENT_ID="あなたの_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="あなたの_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/auth/google/callback"

# Cloudinary（任意）
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

PORT=3000
NODE_ENV=development
```

### frontend 用（`frontend/.env`）

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## ステップ 8：ngrok を起動（OAuth 用）

別ターミナルで次を実行します：
```powershell
ngrok http 3000
```
表示される HTTPS URL（例：`https://abc123.ngrok.io`）を `backend/.env` の `*_REDIRECT_URI` に設定してください。

---

## ✅ インストール完了の確認ポイント

- Node.js がインストールされている
- PostgreSQL がインストール・起動している
- Redis がインストール・起動している
- ngrok がインストール・設定済み
- backend/frontend の依存関係が `npm install` で入っている
- データベースにマイグレーションが適用されている（`npx prisma migrate deploy`）

---

## トラブルシューティング（よくある問題）

### `npm install` が失敗する
- `node_modules` と `package-lock.json` を削除して再度 `npm install` を試す

### データベース接続エラー
- PostgreSQL が起動しているか、`backend/.env` の `DATABASE_URL` が正しいか確認

### Redis 接続エラー
- `redis-cli ping` が `PONG` を返すか確認

### ポート競合
- 他のプロセスが 3000 / 5173 を使っていないか確認。必要なら `backend/.env` の `PORT` を変更

---

## サービスの確認

- PostgreSQL：OS のサービス一覧や `psql` で確認
- Redis：`redis-cli ping` で確認
- ngrok：ターミナルの Forwarding 表示を確認

必要であれば、インストール手順を個別に補足します。
