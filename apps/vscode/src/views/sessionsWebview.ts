import * as vscode from 'vscode';
import {
  loadRegistry,
  listProjects,
  listBranches,
  getBranchEntries,
  deleteSession,
  loadConfig,
  saveConfig,
} from 'contextcarry-core';
import type { StorageConfig, AppConfig } from 'contextcarry-types';
import { getSessionsHtml } from './sessionsHtml';

export class SessionsWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'contextcarry.sessions';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly storageConfig: StorageConfig,
  ) {}

  refresh() {
    if (this._view) {
      this._sendTree('');
    }
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    const codiconUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'codicon.css'),
    );

    webviewView.webview.html = this._getHtml(codiconUri);

    // Resend data when panel becomes visible again (e.g. toggling sidebar)
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendTree('');
        this._sendConfig();
      }
    });

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      // Webview signals it's ready to receive messages
      if (msg.type === 'ready') {
        await this._sendTree('');
        this._sendConfig();
        return;
      }
      switch (msg.type) {
        case 'search':
          await this._sendTree(msg.query);
          break;
        case 'changeProvider': {
          const config = await loadConfig();

          const providerModels: Record<string, string[]> = {
            anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-opus-4-20250514'],
            openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],
            gemini: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
            glm: ['glm-4.5', 'glm-4-plus', 'glm-4-flash'],
            grok: ['grok-3', 'grok-3-mini', 'grok-2'],
          };

          // Step 1: Pick provider
          const providers = Object.keys(providerModels);
          const pickedProvider = await vscode.window.showQuickPick(
            providers.map(p => ({
              label: p,
              description: p === config.defaultProvider ? '(current)' : '',
            })),
            { placeHolder: 'Select AI provider' },
          );
          if (!pickedProvider) break;
          const provider = pickedProvider.label;

          // Step 2: Pick model
          const models = providerModels[provider] || [];
          const currentModel = (config[provider as keyof typeof config] as any)?.model;
          const pickedModel = await vscode.window.showQuickPick(
            models.map(m => ({
              label: m,
              description: m === currentModel ? '(current)' : '',
            })),
            { placeHolder: `Select model for ${provider}` },
          );
          if (!pickedModel) break;

          // Step 3: Ask for API key (pre-fill existing)
          const existingKey = (config[provider as keyof typeof config] as any)?.apiKey || '';
          const apiKey = await vscode.window.showInputBox({
            prompt: `Enter API key for ${provider}`,
            value: existingKey,
            password: true,
            placeHolder: 'sk-...',
          });
          if (apiKey === undefined) break;

          // Step 4: Save to config
          config.defaultProvider = provider as any;
          const providerConfig = (config[provider as keyof typeof config] as any) || {};
          providerConfig.model = pickedModel.label;
          if (apiKey) providerConfig.apiKey = apiKey;
          (config as any)[provider] = providerConfig;

          await saveConfig(config);
          this._sendConfig();
          vscode.window.showInformationMessage(`Switched to ${provider} / ${pickedModel.label}`);
          break;
        }
        case 'open':
          await vscode.window.showTextDocument(vscode.Uri.file(msg.filePath), { preview: true });
          break;
        case 'delete': {
          const confirm = await vscode.window.showWarningMessage(
            `Delete session ${msg.sessionId.substring(0, 8)}?`,
            { modal: true },
            'Delete',
          );
          if (confirm === 'Delete') {
            const deleted = await deleteSession(msg.sessionId, this.storageConfig);
            if (deleted) {
              vscode.window.showInformationMessage('Session deleted');
              await this._sendTree('');
            }
          }
          break;
        }
        case 'diff': {
          const registry = await loadRegistry(this.storageConfig);
          const others = registry.sessions.filter(s => s.sessionId !== msg.sessionId);
          if (others.length === 0) {
            vscode.window.showInformationMessage('No other sessions to compare with');
            return;
          }
          const picked = await vscode.window.showQuickPick(
            others.map(s => ({
              label: `${s.projectName}/${s.branch}`,
              description: s.sessionId.substring(0, 8),
              detail: new Date(s.timestamp).toLocaleString(),
              filePath: s.filePath,
            })),
            { placeHolder: 'Pick a session to compare with' },
          );
          if (picked) {
            await vscode.commands.executeCommand('vscode.diff',
              vscode.Uri.file(picked.filePath),
              vscode.Uri.file(msg.filePath),
              `${picked.description} ↔ ${msg.sessionId.substring(0, 8)}`,
            );
          }
          break;
        }
      }
    });
  }

  private async _sendConfig() {
    if (!this._view) return;
    const config = await loadConfig();
    const provider = config.defaultProvider || 'none';
    const providerConfig = config[provider as keyof AppConfig] as { model?: string } | undefined;
    const model = providerConfig?.model || '';
    this._view.webview.postMessage({ type: 'config', provider, model });
  }

  private async _sendTree(query: string) {
    if (!this._view) return;
    const registry = await loadRegistry(this.storageConfig);
    const q = query.toLowerCase().trim();

    const tree: ProjectNode[] = [];

    for (const project of listProjects(registry)) {
      const branches: BranchNode[] = [];
      for (const branch of listBranches(registry, project)) {
        let entries = getBranchEntries(registry, project, branch);
        if (q) {
          entries = entries.filter(s =>
            s.projectName.toLowerCase().includes(q) ||
            s.branch.toLowerCase().includes(q) ||
            s.summary.toLowerCase().includes(q)
          );
        }
        if (entries.length > 0) {
          branches.push({
            name: branch,
            sessions: entries.map(s => ({
              id: s.sessionId,
              shortId: s.sessionId.substring(0, 8),
              date: new Date(s.timestamp).toLocaleString(),
              summary: s.summary.substring(0, 80),
              filePath: s.filePath,
            })),
          });
        }
      }
      if (branches.length > 0) {
        tree.push({ name: project, branches });
      }
    }

    this._view.webview.postMessage({ type: 'tree', tree, query: q });
  }

  private _getHtml(codiconUri: vscode.Uri): string {
    const nonce = getNonce();
    const csp = [
      `default-src 'none'`,
      `style-src ${this._view!.webview.cspSource} 'unsafe-inline'`,
      `font-src ${this._view!.webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return getSessionsHtml(csp, codiconUri, nonce);
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

interface SessionNode {
  id: string;
  shortId: string;
  date: string;
  summary: string;
  filePath: string;
}

interface BranchNode {
  name: string;
  sessions: SessionNode[];
}

interface ProjectNode {
  name: string;
  branches: BranchNode[];
}
