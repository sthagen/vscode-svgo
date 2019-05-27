import * as vscode from 'vscode';
import setText from 'vscode-set-text';
import merge = require('lodash.merge');
import SVGO = require('svgo');
const { workspace, window, commands } = vscode;

function getConfig(config: SVGO.Options): SVGO.Options {
  const svgoConfig = workspace.getConfiguration('svgo');
  const js2svg = {
    indent: svgoConfig.get('indent') as number,
    pretty: svgoConfig.get('pretty') as boolean,
    useShortTags: svgoConfig.get('useShortTags') as boolean
  };
  const plugins = [{
    removeTitle: false
  }, {
    removeViewBox: false
  }];

  return merge(config, {
    js2svg,
    plugins
  });
}

async function optimize(text: string, config: SVGO.Options): Promise<string> {
  const svgo = new SVGO(config);
  const { data } = await svgo.optimize(text);

  return data;
}

function isSVG(document: vscode.TextDocument): boolean {
  const { languageId, fileName } = document;

  return languageId === 'xml' && fileName.endsWith('.svg');
}

export function activate(context: vscode.ExtensionContext) {
  const minify = commands.registerCommand('svgo.minify', async () => {
    if (!window.activeTextEditor) {
      return;
    }

    const { document } = window.activeTextEditor;

    if (!isSVG(document)) {
      return;
    }

    const config = getConfig({
      js2svg: {
        pretty: false
      }
    });
    const text = await optimize(document.getText(), config);

    await setText(text);
  });

  const minifyAll = commands.registerCommand('svgo.minify-all', async () => {
    const config = getConfig({
      js2svg: {
        pretty: false
      }
    });

    workspace.textDocuments.filter(textDocument => {
      return isSVG(textDocument);
    }).forEach(async textDocument => {
      const textEditor = await window.showTextDocument(textDocument);
      const text = await optimize(textDocument.getText(), config);
      await setText(text, textEditor);
    });
  });

  const prettify = commands.registerCommand('svgo.prettify', async () => {
    if (!window.activeTextEditor) {
      return;
    }

    const { document } = window.activeTextEditor;

    if (!isSVG(document)) {
      return;
    }

    const config = getConfig({
      js2svg: {
        pretty: true
      }
    });
    const text = await optimize(document.getText(), config);

    await setText(text);
  });

  const prettifyAll = commands.registerCommand('svgo.prettify-all', async () => {
    const config = getConfig({
      js2svg: {
        pretty: true
      }
    });

    workspace.textDocuments.filter(textDocument => {
      return isSVG(textDocument);
    }).forEach(async textDocument => {
      const textEditor = await window.showTextDocument(textDocument);
      const text = await optimize(textDocument.getText(), config);
      await setText(text, textEditor);
    });
  });

  context.subscriptions.push(minify);
  context.subscriptions.push(minifyAll);
  context.subscriptions.push(prettify);
  context.subscriptions.push(prettifyAll);
};

export function deactivate() {}
