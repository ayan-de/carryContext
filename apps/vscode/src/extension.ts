import * as vscode from 'vscode';
import { SessionsWebviewProvider } from './views/sessionsWebview';
import { createStatusBar } from './statusBar';
import { loadConfig, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';

export async function activate(context: vscode.ExtensionContext) {
  const config = await loadConfig();
  const storageConfig = { ...DEFAULT_STORAGE_CONFIG, dataDir: config.dataDir };

  // Status bar — show provider + model
  context.subscriptions.push(createStatusBar(config));

  // Sessions webview (search + tree in one panel)
  const sessionsProvider = new SessionsWebviewProvider(context.extensionUri, storageConfig);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SessionsWebviewProvider.viewType, sessionsProvider),
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcarry.refresh', () => sessionsProvider.refresh()),
    vscode.commands.registerCommand('contextcarry.save', () => {
      vscode.window.showInformationMessage('Context Carry: Save — coming in 4.7');
    }),
    vscode.commands.registerCommand('contextcarry.load', () => {
      vscode.window.showInformationMessage('Context Carry: Load — coming in 4.7');
    }),
    vscode.commands.registerCommand('contextcarry.search', () => {
      // No-op — search is now inline in the webview
    }),
    vscode.commands.registerCommand('contextcarry.delete', () => {
      // Handled inside webview
    }),
    vscode.commands.registerCommand('contextcarry.diff', () => {
      // Handled inside webview
    }),
  );
}

export function deactivate() {}
