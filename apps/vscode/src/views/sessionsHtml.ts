import type * as vscode from 'vscode';

export function getSessionsHtml(csp: string, codiconUri: vscode.Uri, nonce: string): string {
  return /*html*/ `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="${csp}">
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

  <script nonce="${nonce}">
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
