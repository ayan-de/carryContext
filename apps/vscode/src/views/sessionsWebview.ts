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
      vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'),
    );

    webviewView.webview.html = this._getHtml(codiconUri);
    this._sendTree('');
    this._sendConfig();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
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
    return /*html*/ `<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="${codiconUri}" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
  }

  .search-wrapper {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 8px 8px 4px;
    background: var(--vscode-sideBar-background);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .search-box {
    position: relative;
    flex: 1;
  }
  .btn-refresh {
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .btn-refresh:hover {
    color: var(--vscode-foreground);
    background: var(--vscode-list-hoverBackground);
  }
  .btn-refresh .codicon { font-size: 16px; }
  .search-box .codicon {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vscode-input-placeholderForeground);
    font-size: 14px;
    pointer-events: none;
  }
  #search {
    width: 100%;
    padding: 6px 10px 6px 28px;
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 12px;
    outline: none;
  }
  #search:focus {
    border-color: var(--vscode-focusBorder);
  }
  #search::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }

  .tree { padding: 0 0 8px; }

  .project { user-select: none; }
  .project-header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    font-weight: 200;
    font-size: 12px;
    gap: 4px;
    cursor: pointer;
  }
  .project-header:hover { background: var(--vscode-list-hoverBackground); }
  .project-header .codicon { font-size: 14px; color: var(--vscode-icon-foreground); }

  .branch { user-select: none; }
  .branch-header {
    display: flex;
    align-items: center;
    padding: 3px 8px 3px 24px;
    font-size: 12px;
    gap: 4px;
    cursor: pointer;
    color: var(--vscode-foreground);
  }
  .branch-header:hover { background: var(--vscode-list-hoverBackground); }
  .branch-header .codicon { font-size: 14px; color: var(--vscode-icon-foreground); }

  .session {
    display: flex;
    align-items: center;
    padding: 3px 8px 3px 42px;
    cursor: pointer;
    font-size: 11px;
    gap: 4px;
  }
  .session:hover { background: var(--vscode-list-hoverBackground); }
  .session .codicon-file { font-size: 14px; color: var(--vscode-icon-foreground); flex-shrink: 0; }
  .session-label {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .session-id {
    color: var(--vscode-descriptionForeground);
    font-family: var(--vscode-editor-font-family);
    font-size: 10px;
    flex-shrink: 0;
  }

  .actions {
    display: none;
    gap: 2px;
    flex-shrink: 0;
  }
  .session:hover .actions { display: flex; }
  .actions button {
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    padding: 0 2px;
    display: flex;
    align-items: center;
  }
  .actions button:hover { color: var(--vscode-foreground); }
  .actions .codicon { font-size: 14px; }

  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s;
    flex-shrink: 0;
  }
  .chevron.open { transform: rotate(90deg); }
  .chevron .codicon { font-size: 12px; }

  .children { display: none; }
  .children.open { display: block; }

  .empty {
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    padding: 20px 8px;
  }

  .footer {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: var(--vscode-sideBar-background);
    border-top: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
  }
  .footer-info {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
  }
  .footer-info .codicon { font-size: 13px; }
  .footer-provider {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn-change {
    background: none;
    border: none;
    color: var(--vscode-textLink-foreground);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .btn-change:hover {
    background: var(--vscode-list-hoverBackground);
  }
</style>
</head>
<body>
  <div class="search-wrapper">
    <div class="search-box">
      <i class="codicon codicon-search"></i>
      <input id="search" type="text" placeholder="Search projects, branches..." spellcheck="false" autocomplete="off" />
    </div>
    <button class="btn-refresh" id="refreshBtn" title="Refresh"><i class="codicon codicon-refresh"></i></button>
  </div>
  <div id="tree" class="tree"></div>
  <div class="footer">
    <div class="footer-info">
      <i class="codicon codicon-hubot"></i>
      <span class="footer-provider" id="providerLabel">--</span>
    </div>
    <button class="btn-change" id="changeBtn">Change</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const input = document.getElementById('search');
    const treeDiv = document.getElementById('tree');
    let debounceTimer;

    document.getElementById('changeBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'changeProvider' });
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      input.value = '';
      vscode.postMessage({ type: 'search', query: '' });
    });

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        vscode.postMessage({ type: 'search', query: input.value });
      }, 200);
    });

    window.addEventListener('message', (e) => {
      if (e.data.type === 'tree') renderTree(e.data.tree, e.data.query);
      if (e.data.type === 'config') {
        const label = e.data.model ? e.data.provider + ' / ' + e.data.model : e.data.provider;
        document.getElementById('providerLabel').textContent = label;
      }
    });

    function renderTree(tree, query) {
      if (tree.length === 0) {
        treeDiv.innerHTML = '<div class="empty"><i class="codicon codicon-' + (query ? 'search-stop' : 'inbox') + '"></i><br>' + (query ? 'No results' : 'No sessions saved') + '</div>';
        return;
      }
      const autoOpen = !!query;
      treeDiv.innerHTML = tree.map(p => projectHtml(p, autoOpen)).join('');
      bindToggles();
      bindActions();
    }

    function projectHtml(p, autoOpen) {
      const ch = autoOpen ? 'open' : '';
      return '<div class="project">'
        + '<div class="project-header" data-toggle="p-' + esc(p.name) + '">'
        + '<span class="chevron ' + ch + '"><i class="codicon codicon-chevron-right"></i></span>'
        + '<i class="codicon codicon-folder"></i> ' + esc(p.name)
        + '</div>'
        + '<div class="children ' + ch + '" id="p-' + esc(p.name) + '">'
        + p.branches.map(b => branchHtml(p.name, b, autoOpen)).join('')
        + '</div></div>';
    }

    function branchHtml(proj, b, autoOpen) {
      const ch = autoOpen ? 'open' : '';
      const id = 'b-' + esc(proj) + '-' + esc(b.name);
      return '<div class="branch">'
        + '<div class="branch-header" data-toggle="' + id + '">'
        + '<span class="chevron ' + ch + '"><i class="codicon codicon-chevron-right"></i></span>'
        + '<i class="codicon codicon-git-branch"></i> ' + esc(b.name)
        + '</div>'
        + '<div class="children ' + ch + '" id="' + id + '">'
        + b.sessions.map(s => sessionHtml(s)).join('')
        + '</div></div>';
    }

    function sessionHtml(s) {
      return '<div class="session" data-path="' + esc(s.filePath) + '" data-sid="' + esc(s.id) + '">'
        + '<i class="codicon codicon-file"></i>'
        + '<span class="session-label" title="' + esc(s.summary) + '">' + esc(s.date) + '</span>'
        + '<span class="session-id">' + esc(s.shortId) + '</span>'
        + '<span class="actions">'
        + '<button class="btn-diff" title="Compare"><i class="codicon codicon-diff"></i></button>'
        + '<button class="btn-del" title="Delete"><i class="codicon codicon-trash"></i></button>'
        + '</span></div>';
    }

    function bindToggles() {
      treeDiv.querySelectorAll('[data-toggle]').forEach(el => {
        el.addEventListener('click', () => {
          const target = document.getElementById(el.dataset.toggle);
          if (target) {
            target.classList.toggle('open');
            el.querySelector('.chevron').classList.toggle('open');
          }
        });
      });
    }

    function bindActions() {
      treeDiv.querySelectorAll('.session').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.actions')) return;
          vscode.postMessage({ type: 'open', filePath: el.dataset.path });
        });
      });
      treeDiv.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = btn.closest('.session');
          vscode.postMessage({ type: 'delete', sessionId: s.dataset.sid });
        });
      });
      treeDiv.querySelectorAll('.btn-diff').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = btn.closest('.session');
          vscode.postMessage({ type: 'diff', sessionId: s.dataset.sid, filePath: s.dataset.path });
        });
      });
    }

    function esc(str) {
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
  }
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
