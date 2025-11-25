---
# 🔑 Meta（Facebook）開発者セットアップガイド

Instagram の投稿連携に必要な Meta / Facebook アプリの作成手順を日本語でまとめたガイドです。

## 必要なもの

- Facebook アカウント
- Instagram ビジネスアカウント（Instagram の設定 → アカウント → プロアカウントに切り替え）
- Instagram が接続された Facebook ページ

---

## ステップ 1：Meta アプリを作成する

1. https://developers.facebook.com にアクセス
2. 右上の「My Apps」をクリック
3. 「Create App」をクリック
4. 「Business」タイプを選択して「Next」をクリック
5. 必要事項を入力：
   - App Name（例）: Instagram AutoPoster
   - App Contact Email: ご自身のメールアドレス
   - 「Create App」をクリック

---

## ステップ 2：Instagram Basic Display を追加する

1. アプリダッシュボードで「Add Products」に移動
2. 「Instagram Basic Display」を探して「Set Up」をクリック
3. 下にスクロールして「User Token Generator」を確認
4. 「Add or Remove Instagram Testers」をクリック
5. 「Add Instagram Testers」をクリック
6. Instagram のユーザー名を入力して「Submit」をクリック
7. Instagram アプリ側で「設定」→「Apps and Websites」へ行き、テスター招待を承認

---

## ステップ 3：Instagram Graph API の設定

1. アプリダッシュボードで「Instagram Graph API」を見つけて「Set Up」をクリック（表示されない場合は先に Instagram Basic Display を追加）
2. 左メニューの「Settings」→「Basic」を開く
3. 以下の値を控えておく（後で .env に設定します）:
   - App ID
   - App Secret（「Show」をクリックして表示）

---

## ステップ 4：リダイレクト URI を追加する

1. 「Basic」設定の「App Domains」に `localhost` を追加
2. 「Add Platform」→「Website」を選び、Site URL を `http://localhost:3000` に設定
3. Instagram Graph API の設定で「OAuth Redirect URIs（Valid OAuth Redirect URIs）」を探し、以下を追加：
```
http://localhost:3000/api/v1/auth/instagram/callback
https://YOUR_NGROK_URL/api/v1/auth/instagram/callback
```
※ YOUR_NGROK_URL は ngrok の HTTPS URL に置き換えてください
4. 変更を保存（Save Changes）

---

## ステップ 5：必要な権限（Permissions）を取得する

1. 左メニューの「App Review」→「Permissions and Features」を開く
2. 開発時に最低限必要な権限（例）：
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
   - `instagram_manage_insights`

※ 開発や自分だけのテストであれば標準権限（Standard Access）で足ります。複数ユーザー向けの本番運用では「Advanced Access（アプリ審査）」が必要です。

---

## ステップ 6：アプリを公開モードに切り替える（Live にする）

1. 右上のモードを「Development」から「Live」に切り替え
2. Privacy Policy URL を求められた場合は一時的に以下を使用できます：
   - `https://www.termsfeed.com/privacy-policy-generator/`（テンプレ）
   - または `http://localhost:3000/privacy`（簡易ページを自分で作成）
3. モードを切り替え（Switch Mode）

---

## ステップ 7：Google Cloud（Google Drive 用）を設定する

1. https://console.cloud.google.com にアクセス
2. 「Select a project」→「New Project」から新規プロジェクトを作成（例：Instagram AutoPoster）
3. ダッシュボードで「APIs & Services」→「Enable APIs and Services」を選択
4. 有効化する API：
   - Google Drive API
   - Google Sheets API（認証やライセンス管理で必要な場合）
5. 「Create Credentials」→「OAuth client ID」を選択し、OAuth 同意画面を設定
6. OAuth クライアントを作成（Application type: Web application）し、Authorized redirect URIs に以下を追加：
```
http://localhost:3000/api/v1/auth/google/callback
https://YOUR_NGROK_URL/api/v1/auth/google/callback
```
7. 作成後に表示される Client ID と Client Secret を控える

---

## ステップ 8：取得した情報を `.env` に追加する

`backend/.env` に次のように設定してください（例）：

```env
# Meta / Instagram
META_APP_ID="<あなたの_APP_ID>"
META_APP_SECRET="<あなたの_APP_SECRET>"
META_REDIRECT_URI="https://YOUR_NGROK_URL/api/v1/auth/instagram/callback"

# Google
GOOGLE_CLIENT_ID="<あなたの_GOOGLE_CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<あなたの_GOOGLE_CLIENT_SECRET>"
GOOGLE_REDIRECT_URI="https://YOUR_NGROK_URL/api/v1/auth/google/callback"
```

`YOUR_NGROK_URL` は実際の ngrok の HTTPS URL に置き換えてください（例：`https://abc123.ngrok.io`）。

---

## ✅ セットアップ完了

上記が完了すれば、Meta アプリ（Instagram 用）の基本設定は整っています。

---

## 🔍 トラブルシューティング

### 「Redirect URI mismatch（リダイレクト URI が一致しない）」エラー
- `.env` に入れた ngrok の URL と Meta アプリの設定が一致しているか確認
- `http://localhost:3000` と `https://ngrok-url` の両方を追加しておく
- .env を変更したらバックエンドを再起動

### 「Invalid App ID（無効な App ID）」エラー
- META_APP_ID が正しく入力されているか（余分な空白が入っていないか）を確認
- アプリが Development モードになっていないか確認（本番は Live）

### Instagram に接続できない
- Instagram アカウントが Business か Creator になっているか
- Instagram が Facebook ページに接続されているか
- 必要な権限が許可されているか

### Google Drive が動作しない
- Google Drive API が有効化されているか
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET が正しいか
- リダイレクト URI が一致しているか

---

## 📸 関連情報の確認場所

### Meta アプリ ID / Secret の確認
1. https://developers.facebook.com/apps にアクセス
2. 対象のアプリを選択
3. 「Settings」→「Basic」で App ID / App Secret を確認

### Instagram の権限確認
1. https://developers.facebook.com/apps にアクセス
2. 対象のアプリを選択
3. 「App Review」→「Permissions and Features」を確認

### Google の認証情報確認
1. https://console.cloud.google.com にアクセス
2. 該当プロジェクトを選択
3. 「APIs & Services」→「Credentials」で OAuth 2.0 クライアントを確認

---

完了しました。これでアプリから Instagram を接続できるはずです。
