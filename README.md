# まことクラブ Web

風俗で働く女の子のための口コミメディア「まことクラブ」のフロントエンドリポジトリです。Next.js (App Router, TypeScript) と Tailwind CSS をベースに、LINE OAuth 連携やレビュー検索・投稿などの機能を構築します。

## セットアップ

```bash
npm install
npm run dev
```

開発サーバーは `http://localhost:3000` で起動します。

## スクリプト

- `npm run dev` – 開発サーバー起動
- `npm run build` – 本番ビルド
- `npm run start` – 本番ビルドの起動
- `npm run lint` – ESLint チェック
- `npm run format` – Prettier で整形

## 主な画面

- `/` トップ: 検索フォーム、新着口コミ、高評価口コミ、キャンペーン案内
- `/stores` 店舗一覧: 都道府県・業種・平均稼ぎでフィルタ、10件ずつ表示
- `/reviews` アンケート一覧: 同条件で検索、並び替え（新着／役に立った順／平均稼ぎ順）
- `/reviews/[id]` レビュー詳細: 各口コミの詳細情報
- `/reviews/new` アンケート投稿: LINE OAuth 後に React Hook Form で投稿
- `/terms` / `/privacy` / `/contact` 各種静的ページ

## 開発メモ

- データ取得は `src/lib/reviews.ts` と `src/lib/stores.ts` に集約しています。`API_BASE_URL` または `NEXT_PUBLIC_API_BASE_URL` が未設定の場合、`src/data/mock-reviews.ts` によるモックデータを返します。
- LINE ログイン後のアクセストークンは `sessionStorage` に `makotoClubLineAuth` で保存する想定です。保存フォーマットは `ReviewForm` コンポーネント内の `StoredAuth` 型を参照してください。
- Tailwind CSS v4 を採用しています。プリセットテーマは `src/app/globals.css` で定義しています。
- コード整形には Prettier（`prettier-plugin-tailwindcss` 併用）、Lint には ESLint (flat config) を利用しています。

## 環境変数

必要に応じて `.env.local` に以下を設定してください。

```
NEXT_PUBLIC_LINE_LOGIN_URL=<LINE OAuth のフロント向けログインURL>
NEXT_PUBLIC_API_BASE_URL=<バックエンドAPIのエンドポイント>
SITE_URL=<本番サイトのURL> # 任意: メタデータ用
```

`NEXT_PUBLIC_API_BASE_URL` を設定するとバックエンドAPIへ直接 `fetch` します。未設定の場合はモックデータで画面を構成します。

## ディレクトリ構成

```
src/
  app/                Next.js App Router のルート
  components/         UI コンポーネント群
  constants/          選択肢などの定数
  data/               モックデータ
  lib/                API アクセスや集約ロジック
  types/              TypeScript 型定義
```

## 今後のTODO

- バックエンドAPI仕様決定後の `fetch` 実装差し替え
- LINE OAuth フローの実接続
- 役に立ったボタン等のインタラクティブ機能追加
- デザインガイドライン（ブランドカラー・ロゴ）の確定
