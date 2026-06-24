# Web版 画像埋め込み 設計

- 日付: 2026-06-24
- 対象: tatemd Web版（静的・サーバー無し・外部送信なし・オフライン）
- ゴール: 縦書き原稿にローカル画像を埋め込めるようにする。

## 決定事項（ユーザー承認済み）
- **ローカル画像を data URL で埋め込む**（アップロードなし・完全クライアントサイド）。
- **挿入時に自動縮小**して localStorage（約5MB）保存失敗を防ぐ。

## 挿入方法（3経路）
1. **ドラッグ&ドロップ**: textarea に画像ファイルをドロップ。
2. **ペースト**: クリップボード画像を Cmd/Ctrl+V。
3. **`画像` ボタン**: ヘッダ `.app-actions` に追加（`<input type=file accept=image/*>` をトリガ）。

いずれも → 縮小 → `![<ファイル名>](data:image/webp;base64,...)` をカーソル位置に挿入 → textarea に `input` イベントを発火して既存のデバウンス描画/保存を再利用。

## 自動縮小
- `<img>` で読み込み → `<canvas>` に **長辺 最大 1600px** で描画 → `canvas.toDataURL('image/webp', 0.85)`。
- WebP 未対応なら `image/jpeg` にフォールバック（透過が必要な PNG はフォールバック時に背景白で潰れる点は許容＝写真主用途）。
- 元が上限以下なら拡大しない。
- 依存追加なし（`FileReader` / `Image` / `canvas` はネイティブ）。

## 縦書きでの表示
- `vertical.css` に `.tategaki img` を追加：横組みの島（`writing-mode: horizontal-tb`）として正立、`max-inline-size`（列幅に収まる）＋`max-block-size`（用紙高に収まる）＋中央寄せ＋`margin-block`。
- 1 か所で **プレビュー / Vivliostyle印刷 / 絵巻** すべてに反映（全経路が `.tategaki` + `vertical.css` を使う）。

## 構成
- 新規 `src/adapter/imageInsert.ts`:
  - `imageMarkdown(alt, url): string` — 純粋。
  - `spliceText(value, start, end, insert): { value, cursor }` — 純粋（カーソル挿入）。
  - `fileToImageMarkdown(file, opts?): Promise<string>` — 縮小して data URL → markdown（canvas 使用）。
  - `initImageInput(textarea, afterInsert)` — drop / paste を結線し、FileList を処理する共通ハンドラを提供。
- `index.html`: `画像` ボタン＋隠し file input。
- `src/adapter/app.ts`: ボタン/ file input を結線（drop・paste は imageInsert が担当）。挿入後は `textarea.dispatchEvent(new Event('input'))`。
- core（markdown）は変更不要（画像記法・`validateLink` の `data:image/*` 許可は既存）。

## テスト
- `imageInsert.test.ts`: `imageMarkdown` と `spliceText`（純粋関数）。
- 縮小（canvas）は jsdom で canvas 非対応のため Chrome 実機で確認。

## スコープ外（YAGNI）
リサイズハンドル・キャプション・配置指定・外部URL専用UI・複数画像の一括最適化。
