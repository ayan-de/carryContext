import * as vscode from 'vscode';
import { SessionExplorerProvider, SessionTreeItem } from './views/sessionExplorer';
import { createStatusBar } from './statusBar';
import { loadConfig } from 'contextcarry-core';
import { loadRegistry, readContextFile, deleteSession, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';

let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  const config = await loadConfig();
  const storageConfig = { ...DEFAULT_STORAGE_CONFIG, dataDir: config.dataDir };

  // Status bar — show provider + model
  statusBarItem = createStatusBar(config);
  context.subscriptions.push(statusBarItem);

  // Session Explorer TreeView
  const sessionProvider = new SessionExplorerProvider(storageConfig);
  const treeView = vscode.window.createTreeView('contextcarry.sessions', {
    treeDataProvider: sessionProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcarry.refresh', () => {
      sessionProvider.refresh();
    }),

    vscode.commands.registerCommand('contextcarry.save', () => {
      vscode.window.showInformationMessage('Context Carry: Save — coming in 4.7');
    }),

    vscode.commands.registerCommand('contextcarry.load', () => {
      vscode.window.showInformationMessage('Context Carry: Load — coming in 4.7');
    }),

    vscode.commands.registerCommand('contextcarry.openSession', async (filePath: string) => {
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri, { preview: true });
    }),

    vscode.commands.registerCommand('contextcarry.delete', async (item: SessionTreeItem) => {
      if (item.contextValue !== 'session' || !item.sessionId) return;

      const confirm = await vscode.window.showWarningMessage(
        `Delete session ${item.sessionId.substring(0, 8)}?`,
        { modal: true },
        'Delete'
      );
      if (confirm !== 'Delete') return;

      const deleted = await deleteSession(item.sessionId, storageConfig);
      if (deleted) {
        vscode.window.showInformationMessage('Session deleted');
        sessionProvider.refresh();
      } else {
        vscode.window.showErrorMessage('Session not found');
      }
    }),

    vscode.commands.registerCommand('contextcarry.diff', async (item: SessionTreeItem) => {
      if (item.contextValue !== 'session' || !item.filePath) return;

      // Pick another session to diff against
      const registry = await loadRegistry(storageConfig);
      const allSessions = registry.sessions.filter(s => s.sessionId !== item.sessionId);

      if (allSessions.length === 0) {
        vscode.window.showInformationMessage('No other sessions to compare with');
        return;
      }

      const picked = await vscode.window.showQuickPick(
        allSessions.map(s => ({
          label: `${s.projectName}/${s.branch}`,
          description: s.sessionId.substring(0, 8),
          detail: new Date(s.timestamp).toLocaleString(),
          filePath: s.filePath,
        })),
        { placeHolder: 'Pick a session to compare with' }
      );

      if (!picked) return;

      await vscode.commands.executeCommand('vscode.diff',
        vscode.Uri.file(picked.filePath),
        vscode.Uri.file(item.filePath!),
        `${picked.description} ↔ ${item.sessionId!.substring(0, 8)}`
      );
    }),
  );
}

export function deactivate() {}
