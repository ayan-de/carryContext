import * as vscode from 'vscode';
import type { AppConfig } from 'contextcarry-types';

export function createStatusBar(config: AppConfig): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  const provider = config.defaultProvider || 'none';
  const providerConfig = config[provider as keyof AppConfig] as { model?: string } | undefined;
  const model = providerConfig?.model || '';

  item.text = model ? `$(bookmark) ${provider} · ${model}` : `$(bookmark) ${provider}`;
  item.tooltip = 'Context Carry — Active AI Provider';
  item.command = 'contextcarry.refresh';
  item.show();

  return item;
}
