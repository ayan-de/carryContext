import * as vscode from 'vscode';
import {
  loadRegistry,
  listProjects,
  listBranches,
  getBranchEntries,
} from 'contextcarry-core';
import type { StorageConfig, RegistryEntry } from 'contextcarry-types';

export class SessionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: 'project' | 'branch' | 'session',
    public readonly projectName?: string,
    public readonly branchName?: string,
    public readonly sessionId?: string,
    public readonly filePath?: string,
  ) {
    super(label, collapsibleState);
    this.contextValue = contextValue;

    if (contextValue === 'project') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (contextValue === 'branch') {
      this.iconPath = new vscode.ThemeIcon('git-branch');
    } else if (contextValue === 'session') {
      this.iconPath = new vscode.ThemeIcon('file-text');
      this.command = {
        command: 'contextcarry.openSession',
        title: 'Open Session',
        arguments: [filePath],
      };
    }
  }
}

export class SessionExplorerProvider implements vscode.TreeDataProvider<SessionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SessionTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storageConfig: StorageConfig) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SessionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SessionTreeItem): Promise<SessionTreeItem[]> {
    const registry = await loadRegistry(this.storageConfig);

    // Root level — list projects
    if (!element) {
      const projects = listProjects(registry);
      return projects.map(
        p => new SessionTreeItem(p, vscode.TreeItemCollapsibleState.Collapsed, 'project', p)
      );
    }

    // Project level — list branches
    if (element.contextValue === 'project' && element.projectName) {
      const branches = listBranches(registry, element.projectName);
      return branches.map(
        b => new SessionTreeItem(
          b,
          vscode.TreeItemCollapsibleState.Collapsed,
          'branch',
          element.projectName,
          b,
        )
      );
    }

    // Branch level — list sessions
    if (element.contextValue === 'branch' && element.projectName && element.branchName) {
      const entries = getBranchEntries(registry, element.projectName, element.branchName);
      return entries.map(entry => {
        const date = new Date(entry.timestamp).toLocaleString();
        const shortId = entry.sessionId.substring(0, 8);
        const label = `${shortId} — ${date}`;
        const item = new SessionTreeItem(
          label,
          vscode.TreeItemCollapsibleState.None,
          'session',
          element.projectName,
          element.branchName,
          entry.sessionId,
          entry.filePath,
        );
        item.tooltip = entry.summary.substring(0, 200);
        item.description = entry.summary.substring(0, 60);
        return item;
      });
    }

    return [];
  }
}
