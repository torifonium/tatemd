import * as vscode from 'vscode';
import { Uri, ViewColumn } from 'vscode';
import { renderToTypesettingHtml } from '../../src/core/markdown';

/** デバウンス待機時間（ミリ秒） */
const DEBOUNCE_MS = 150;

/**
 * パネルの webview.html に設定する HTML を組み立てる。
 * CSP: default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'
 */
function buildHtml(
  webview: vscode.Webview,
  cssUri: vscode.Uri,
  markdown: string
): string {
  const bodyHtml = renderToTypesettingHtml(markdown);
  const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TATEmd プレビュー</title>
  <link rel="stylesheet" href="${cssUri}" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #faf9f7;
    }
    .preview-pane {
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      overflow: hidden;
    }
    .tategaki {
      height: 100%;
    }
  </style>
</head>
<body>
  <section class="preview-pane">
    <div class="tategaki">${bodyHtml}</div>
  </section>
</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('tatemd.openPreview', () => {
    // アクティブな Markdown エディタを取得
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage(
        'TATEmd: Markdown ファイルを開いた状態でコマンドを実行してください。'
      );
      return;
    }

    const cssUri = Uri.joinPath(context.extensionUri, 'media', 'vertical.css');

    // Webview パネルを横に開く
    const panel = vscode.window.createWebviewPanel(
      'tatemdPreview',
      'TATEmd プレビュー',
      ViewColumn.Beside,
      {
        enableScripts: false,
        localResourceRoots: [Uri.joinPath(context.extensionUri, 'media')],
      }
    );

    /** パネルの HTML を現在のドキュメント内容で更新する */
    function refresh(document: vscode.TextDocument): void {
      const webviewCssUri = panel.webview.asWebviewUri(cssUri);
      panel.webview.html = buildHtml(panel.webview, webviewCssUri, document.getText());
    }

    // 初回描画
    refresh(editor.document);

    // テキスト変更をデバウンスして再描画
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      // アクティブエディタのドキュメントのみ対象
      if (event.document !== vscode.window.activeTextEditor?.document) {
        return;
      }
      if (event.document.languageId !== 'markdown') {
        return;
      }

      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        refresh(event.document);
      }, DEBOUNCE_MS);
    });

    // パネルが閉じられたら購読解除
    panel.onDidDispose(() => {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
      changeSubscription.dispose();
    }, null, context.subscriptions);

    context.subscriptions.push(changeSubscription);
  });

  context.subscriptions.push(command);
}

export function deactivate(): void {
  // 特に後処理なし
}
