# z_exam_app

## Web版への移行について

このリポジトリはElectronを廃止し、ブラウザで動作するVue 3+ViteのWebアプリとして再構成しました。アプリは`web/`ワークスペースで動作します。

## 使い方

1. 依存関係のインストール
   
	npm install

2. 開発サーバー起動
   
	npm run dev

	ブラウザで http://localhost:5173 を開きます。

3. CSV インポート/エクスポート
	- 画面右上の「インポート」で CSV を選択すると読み込まれます。
	- 「エクスポート」で現在のデータを CSV ダウンロードします。

4. 保存
	- 「保存」でブラウザの localStorage に永続化します（IndexedDB への切り替えは将来検討）。

## スクリプト

- 開発: `npm run dev`
- ビルド: `npm run build`
- プレビュー: `npm run preview`

## 構成

- `web/` Vite + Vue 3 + TypeScript + Pinia + Element Plus
  - `src/stores/questions.ts`: データ管理（localStorage 永続化）
  - `src/components/`: UI コンポーネント
  - `src/App.vue`: 画面構成

## 既知の注意点

- 初回はデータが空です。CSV をインポートしてから編集・保存してください。
- 保存先は localStorage のため、ブラウザや端末を跨ぐ同期はありません。
# Z Exam App

Electron + Vue 3 + TypeScript app per design docs. MVP implements:
- SC-001 main screen with tree/list and editor
- UC-001..UC-005 basic flows
- CSV import/export dialogs (UC-006/007) – export uses browser download for MVP

## Run
- Install dependencies in workspace root, then start dev server.

```bash
npm i
npm run dev
```

## Notes
- MathJax preview supports inline `$...$` and block `$$...$$` in the preview text.
- Persistence: TODO switch to IndexedDB for Web; current store uses localStorage.
