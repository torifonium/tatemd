import * as vscode from 'vscode';
import { Uri, ViewColumn } from 'vscode';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { renderToTypesettingHtml } from '../../src/core/markdown';
import { buildEmakiDocument } from '../../src/core/emakiDocument';

/** デバウンス待機時間（ミリ秒） */
const DEBOUNCE_MS = 150;

/** CSP の nonce（インラインスクリプト許可用）。 */
function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  return nonce;
}

/** キャレットのドキュメント内オフセット比率（0〜1）を求める。 */
function caretRatio(editor: vscode.TextEditor): number {
  const offset = editor.document.offsetAt(editor.selection.active);
  const len = editor.document.getText().length || 1;
  return Math.min(1, Math.max(0, offset / len));
}

/**
 * プレビュー webview の「外枠」HTML を一度だけ組み立てる。
 * 本文は postMessage の `render` で差分更新し（丸ごと再読込しない＝ちらつき/白飛び防止）、
 * `scroll` で編集中のキャレット位置へ横スクロール追従する。
 */
function buildShellHtml(
  webview: vscode.Webview,
  cssUri: vscode.Uri,
  nonce: string,
  initialBodyHtml: string,
): string {
  const csp =
    `default-src 'none'; img-src ${webview.cspSource} https: data:; ` +
    `style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TATEmd プレビュー</title>
  <link rel="stylesheet" href="${cssUri}" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #faf9f7; }
    .preview-pane { height: 100%; padding: 1rem; box-sizing: border-box; overflow: hidden; }
    /* 縦書きでは width:auto だと .tategaki が内容幅まで広がり親に clip され、横スクロール
       できず本文が切れる（白く見える）。pane 幅に拘束すると vertical.css の overflow-x:auto
       が効き、先頭(右)から横スクロールで読める。 */
    .tategaki { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <section class="preview-pane"><div class="tategaki">${initialBodyHtml}</div></section>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const tategaki = document.querySelector('.tategaki');

    // 比率に対応するブロックを横スクロールで中央へ寄せる（編集位置に追従）。
    function scrollToRatio(ratio) {
      const blocks = tategaki.children;
      if (blocks.length === 0) return;
      const idx = Math.min(blocks.length - 1, Math.floor(ratio * blocks.length));
      const el = blocks[idx];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    window.addEventListener('message', (e) => {
      const m = e.data;
      if (m.type === 'render') {
        tategaki.innerHTML = m.html;
        if (typeof m.ratio === 'number') scrollToRatio(m.ratio);
      } else if (m.type === 'scroll') {
        scrollToRatio(m.ratio);
      }
    });

    // 拡張側へ準備完了を通知（初期スクロール位置の送信を促す）。
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('tatemd.openPreview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage(
        'TATEmd: Markdown ファイルを開いた状態でコマンドを実行してください。',
      );
      return;
    }

    // 対象ドキュメント（このプレビューが追従する .md）
    const targetDoc = editor.document;
    const cssUri = Uri.joinPath(context.extensionUri, 'media', 'vertical.css');
    const nonce = getNonce();

    const panel = vscode.window.createWebviewPanel('tatemdPreview', 'TATEmd プレビュー', ViewColumn.Beside, {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(context.extensionUri, 'media')],
    });

    const webviewCssUri = panel.webview.asWebviewUri(cssUri);
    panel.webview.html = buildShellHtml(
      panel.webview,
      webviewCssUri,
      nonce,
      renderToTypesettingHtml(targetDoc.getText()),
    );

    /** 現在のアクティブエディタが対象ドキュメントなら返す。 */
    const activeTargetEditor = (): vscode.TextEditor | undefined => {
      const a = vscode.window.activeTextEditor;
      return a && a.document === targetDoc ? a : undefined;
    };

    // 本文を差分更新（＋編集位置へスクロール）
    const postRender = (): void => {
      const ratio = activeTargetEditor() ? caretRatio(activeTargetEditor()!) : 0;
      void panel.webview.postMessage({ type: 'render', html: renderToTypesettingHtml(targetDoc.getText()), ratio });
    };
    // スクロールのみ（編集位置へ追従）
    const postScroll = (): void => {
      const e = activeTargetEditor();
      if (e) void panel.webview.postMessage({ type: 'scroll', ratio: caretRatio(e) });
    };

    // webview 準備完了で初期スクロール位置を送る
    const readySub = panel.webview.onDidReceiveMessage((m) => {
      if (m && m.type === 'ready') postScroll();
    });

    // テキスト変更（150ms デバウンス）→ 差分描画
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const changeSub = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document !== targetDoc) return;
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(postRender, DEBOUNCE_MS);
    });

    // キャレット移動（テキスト変更なし）→ スクロール追従
    const selSub = vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor.document === targetDoc) postScroll();
    });

    panel.onDidDispose(
      () => {
        if (debounceTimer !== undefined) clearTimeout(debounceTimer);
        readySub.dispose();
        changeSub.dispose();
        selSub.dispose();
      },
      null,
      context.subscriptions,
    );

    context.subscriptions.push(readySub, changeSub, selSub);
  });

  context.subscriptions.push(command);

  // --- 絵巻 PDF 書き出しコマンド ---
  // 縦書き本文だけの自己完結 HTML（core/buildEmakiDocument）を一時ファイルに書き、
  // 既定ブラウザで開く。ユーザーはそこから「PDFで保存」/ ⌘P で横長 1 枚の PDF を得る。
  const exportCommand = vscode.commands.registerCommand('tatemd.exportEmaki', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage(
        'TATEmd: Markdown ファイルを開いた状態でコマンドを実行してください。',
      );
      return;
    }

    try {
      const cssPath = Uri.joinPath(context.extensionUri, 'media', 'vertical.css').fsPath;
      const css = fs.readFileSync(cssPath, 'utf8');
      const html = buildEmakiDocument({
        bodyHtml: renderToTypesettingHtml(editor.document.getText()),
        css,
      });

      const outPath = path.join(os.tmpdir(), `tatemd-emaki-${Date.now()}.html`);
      fs.writeFileSync(outPath, html, 'utf8');

      await vscode.env.openExternal(Uri.file(outPath));
      vscode.window.showInformationMessage(
        'TATEmd: ブラウザで絵巻を開きました。「PDFで保存」または ⌘P / Ctrl+P → 「PDFに保存」で横長1枚の PDF を保存できます。',
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `TATEmd: 絵巻 PDF の書き出しに失敗しました: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  context.subscriptions.push(exportCommand);
}

export function deactivate(): void {
  // 特に後処理なし
}
