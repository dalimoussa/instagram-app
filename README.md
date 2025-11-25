# 📱 Instagram Auto-Posting System# 📱 Instagram Auto-Posting System



Simple Instagram automation for managing multiple business accounts.Simple Instagram automation platform for managing multiple business accounts.



---## ✨ What This Does



## 🎯 **New User? Start Here!**- 🔄 Automatically post to Instagram from Google Drive folders

---
# � Instagram 自動投稿システム

このリポジトリは、複数の Instagram ビジネスアカウントを管理し、Google Drive の素材から自動で投稿するためのシステムです。

以下のドキュメントをご覧いただき、環境をセットアップしてください：

- `START_HERE.md` : 初心者向けのクイックスタート
- `INSTALLATION.md` : インストール手順
- `META_SETUP.md` : Instagram（Meta）と Google の API 設定
- `REQUIREMENTS.md` : 必要なソフトウェアや環境

---

## 🚀 クイックスタート（概要）

1. 必要ソフトをインストール：Node.js、PostgreSQL、Redis、ngrok など（`INSTALLATION.md` を参照）
2. Meta（Facebook）と Google Cloud の設定を行う（`META_SETUP.md` を参照）
3. `start-servers.ps1` を実行してバックエンド・フロントエンドを起動
4. ブラウザで http://localhost:5173 を開いてアプリを利用

---

## 🧭 ドキュメント一覧（役割）

| ファイル | 内容 |
|---|---|
| `START_HERE.md` | 初めての方のためのわかりやすい導入ガイド |
| `REQUIREMENTS.md` | システム要件・必要ソフトの一覧 |
| `INSTALLATION.md` | インストールと初期設定の手順 |
| `META_SETUP.md` | Instagram / Google API の設定手順 |

---

## 🛠️ 基本的な使い方（要約）

1. Instagram アカウントを接続（サイドバー → Accounts → Connect Instagram）
2. Google Drive をテーマとして接続（Themes → Create Theme → Connect Google Drive）
3. スケジュールを作成（Schedules → Schedule Post）
4. 投稿の自動実行または手動実行（Execute Now）
5. 投稿結果と分析は Posts / Analytics で確認

---

## ⚠️ 注意点

- `backend/.env` には API キーやデータベースの接続情報などの機密情報が含まれます。**公開しないでください。**
- 本番運用で複数ユーザーに提供するには、Meta のアプリ審査（Advanced Access）が必要になる場合があります。

---

詳細は `START_HERE.md` と `INSTALLATION.md` を順に実行してください。問題があればログ（バックエンドのコンソール出力とブラウザの DevTools）を確認してお知らせください。

**準備ができたら http://localhost:5173 を開いて使ってみてください！**
1. Click **"Accounts"** in sidebar
