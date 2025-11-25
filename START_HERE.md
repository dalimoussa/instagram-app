# 🎯 クイックスタートガイド（クライアント向け）

このドキュメントは、開発環境でアプリをすばやく立ち上げ、基本的な操作を行うための日本語による簡易ガイドです。

## これが何か

このシステムは次のことができます：
- Google Drive から自動で Instagram に投稿
- 最大 100 の Instagram ビジネスアカウントを管理
- 投稿のスケジューリングと分析（Analytics）

---

## ⚡ 超簡単スタート（3 ステップ）

### 1️⃣ 全部インストール
まず `INSTALLATION.md` を読んでセットアップしてください（所要時間：約30分）

### 2️⃣ Instagram と Google の設定
`META_SETUP.md` を参照し、Meta 開発者アカウント（Instagram 用）と Google Cloud を準備します。

### 3️⃣ アプリを起動
`start-servers.ps1` をダブルクリックするか、ターミナルで実行します：
```powershell
.\start-servers.ps1
```
ブラウザで開く： http://localhost:5173

---

## 📱 基本的な使い方（5 ステップ）

### ステップ 1：アカウント登録
1. http://localhost:5173 を開く
2. 「Register」をクリック
3. メールとパスワードを入力してアカウントを作成

### ステップ 2：Instagram を接続
1. アプリにログイン
2. サイドバーの「Accounts」をクリック
3. 「Connect Instagram」をクリック
4. ビジネスアカウントでログイン

### ステップ 3：Google Drive をリンク
1. サイドバーの「Themes」をクリック
2. 「Create Theme」をクリック
3. テーマ名を入力（例：「My Videos」）
4. 「Connect Google Drive」をクリックしてフォルダを選択

### ステップ 4：投稿をスケジュール
1. サイドバーの「Schedules」をクリック
2. 「Schedule Post」をクリック
3. 以下を入力：
   - 名前、日時、テーマ（Drive フォルダ）、キャプション、投稿先アカウント
4. 「Create Schedule」をクリック

### ステップ 5：動作確認
- 自動投稿：スケジュールに従って自動で投稿されます
- 手動投稿：『Execute Now』で即時投稿
- 投稿履歴：Posts ページで確認
- 分析：Analytics でパフォーマンスを確認

---

## 🆘 よくある問題と対処

### データベースに接続できない
- PostgreSQL がインストールされ起動しているか確認
- `backend/.env` の接続情報（パスワード等）を確認

### Instagram ログインがうまくいかない
- ngrok が起動しているか確認
- `META_SETUP.md` の Redirect URI の設定を確認
- Instagram が Business アカウントであることを確認

### Google Drive が接続できない
- Google Drive API が有効になっているか確認

### サーバーが起動しない
- Node.js がインストールされているか： `node --version`
- backend/frontend で `npm install` を実行済みか
- ポート 3000 と 5173 が使用中でないか確認

---

## 📁 プロジェクト構成（主要ファイル）

```
Project Folder/
├── README.md
├── INSTALLATION.md
├── META_SETUP.md
├── REQUIREMENTS.md
├── start-servers.ps1
├── backend/   ← サーバー側コード
└── frontend/  ← フロントエンド（ブラウザ側）
```

---

## 🔐 重要なファイル

- `backend/.env`：Instagram・Google・DB 等の機密情報を格納します。**公開しないでください。**
- `frontend/.env`：フロントエンドの API URL 等の設定を格納します。

---

## 💡 開発時のコツ

1. ngrok を先に起動してからサーバーを起動してください：
```powershell
ngrok http 3000
```
2. ngrok の URL が変わったら `.env` を更新してください
3. Instagram は Business アカウントが必須です
4. 安定した回線で作業してください（特にアップロード時）

---

## 📊 機能ハイライト

- 最大 100 アカウントの管理（デフォルト）
- 複数投稿のスケジュール管理
- Google Drive から自動で素材を選択して投稿
- 投稿の分析・レポート出力

---

## 🚀 準備が整ったら

1. `REQUIREMENTS.md` を確認
2. `INSTALLATION.md` に従ってセットアップ
3. `META_SETUP.md` で Instagram/Google の設定
4. `start-servers.ps1` を実行してアプリを起動
5. http://localhost:5173 を開いて利用開始

---

何か問題があれば、エラーメッセージと該当の .md ファイルを教えてください。

