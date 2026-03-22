import type * as vscode from 'vscode';

export function getSessionsHtml(csp: string, codiconUri: vscode.Uri, nonce: string): string {
  return /*html*/ `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${codiconUri}" />
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Search bar ── */
  .search-wrapper {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 8px 8px 6px;
    background: var(--vscode-sideBar-background);
    display: flex;
    align-items: center;
    gap: 4px;
    border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
  }

  .search-box {
    position: relative;
    flex: 1;
  }

  .search-box .codicon {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vscode-input-placeholderForeground);
    font-size: 13px;
    pointer-events: none;
  }

  #search {
    width: 100%;
    padding: 5px 10px 5px 28px;
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 3px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 12px;
    outline: none;
    transition: border-color 0.1s;
  }
  #search:focus { border-color: var(--vscode-focusBorder); }
  #search::placeholder { color: var(--vscode-input-placeholderForeground); }

  .btn-icon {
    background: none;
    border: none;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    opacity: 0.75;
    transition: opacity 0.1s, background 0.1s;
  }
  .btn-icon:hover {
    opacity: 1;
    background: var(--vscode-toolbar-hoverBackground, var(--vscode-list-hoverBackground));
  }
  .btn-icon .codicon { font-size: 15px; }

  /* ── Scrollable tree area ── */
  .tree-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2px 0 8px;
  }
  .tree-scroll::-webkit-scrollbar { width: 6px; }
  .tree-scroll::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 3px;
  }
  .tree-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground);
  }

  /* ── Project group ── */
  .project { user-select: none; }

  .project-header {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-foreground));
    opacity: 0.85;
    border-radius: 2px;
    transition: background 0.1s;
  }
  .project-header:hover {
    opacity: 1;
    background: var(--vscode-list-hoverBackground);
  }
  .project-header .codicon {
    font-size: 14px;
    color: var(--vscode-icon-foreground);
    opacity: 0.8;
  }

  /* ── Branch group ── */
  .branch { user-select: none; }

  .branch-header {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px 3px 22px;
    cursor: pointer;
    font-size: 12px;
    color: var(--vscode-foreground);
    border-radius: 2px;
    transition: background 0.1s;
  }
  .branch-header:hover { background: var(--vscode-list-hoverBackground); }
  .branch-header .codicon {
    font-size: 13px;
    color: var(--vscode-gitDecoration-modifiedResourceForeground, var(--vscode-icon-foreground));
    opacity: 0.8;
  }

  /* ── Session row ── */
  .session {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px 3px 38px;
    cursor: pointer;
    font-size: 11.5px;
    border-radius: 2px;
    transition: background 0.1s;
    border-left: 2px solid transparent;
  }
  .session:hover {
    background: var(--vscode-list-hoverBackground);
    border-left-color: var(--vscode-focusBorder);
  }

  .session .codicon-file {
    font-size: 13px;
    color: var(--vscode-icon-foreground);
    opacity: 0.6;
    flex-shrink: 0;
  }

  .session-label {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--vscode-foreground);
  }

  .session-id {
    color: var(--vscode-descriptionForeground);
    font-family: var(--vscode-editor-font-family);
    font-size: 10px;
    opacity: 0.7;
    flex-shrink: 0;
    padding: 1px 4px;
    background: var(--vscode-badge-background, rgba(128,128,128,0.12));
    border-radius: 3px;
  }

  /* ── Action buttons (visible on hover) ── */
  .actions {
    display: none;
    align-items: center;
    gap: 1px;
    flex-shrink: 0;
  }
  .session:hover .actions { display: flex; }

  .actions button {
    background: none;
    border: none;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 2px 3px;
    display: flex;
    align-items: center;
    border-radius: 3px;
    opacity: 0.6;
    transition: opacity 0.1s, background 0.1s;
  }
  .actions button:hover {
    opacity: 1;
    background: var(--vscode-toolbar-hoverBackground, var(--vscode-list-activeSelectionBackground));
  }
  .actions .btn-del:hover { color: var(--vscode-errorForeground); opacity: 1; }
  .actions .codicon { font-size: 13px; }

  /* ── Chevron ── */
  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
    flex-shrink: 0;
    color: var(--vscode-icon-foreground);
    opacity: 0.6;
  }
  .chevron.open { transform: rotate(90deg); }
  .chevron .codicon { font-size: 11px; }

  /* ── Collapsible children ── */
  .children { display: none; }
  .children.open { display: block; }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    padding: 32px 16px;
    opacity: 0.8;
  }
  .empty .codicon { font-size: 28px; opacity: 0.5; }
  .empty p { line-height: 1.5; }

  /* ── Footer ── */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    background: var(--vscode-sideBar-background);
    border-top: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    gap: 6px;
    flex-shrink: 0;
  }

  .footer-info {
    display: flex;
    align-items: center;
    gap: 5px;
    overflow: hidden;
    min-width: 0;
  }
  .footer-info .codicon { font-size: 12px; opacity: 0.7; flex-shrink: 0; }

  .footer-provider {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--vscode-editor-font-family);
    font-size: 10.5px;
    opacity: 0.85;
  }

  .btn-change {
    background: none;
    border: 1px solid var(--vscode-button-secondaryBorder, transparent);
    color: var(--vscode-textLink-foreground);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    flex-shrink: 0;
    transition: background 0.1s;
    white-space: nowrap;
  }
  .btn-change:hover { background: var(--vscode-list-hoverBackground); }
</style>
</head>
<body>
  <div class="search-wrapper">
    <div class="search-box">
      <i class="codicon codicon-search"></i>
      <input id="search" type="text" placeholder="Search projects, branches…" spellcheck="false" autocomplete="off" />
    </div>
    <button class="btn-icon" id="refreshBtn" title="Refresh">
      <i class="codicon codicon-refresh"></i>
    </button>
  </div>

  <div class="tree-scroll">
    <div id="tree"></div>
  </div>

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

    // Signal the extension that the webview is ready to receive messages
    vscode.postMessage({ type: 'ready' });

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
        const label = e.data.model
          ? e.data.provider + ' / ' + e.data.model
          : e.data.provider;
        document.getElementById('providerLabel').textContent = label;
      }
    });

    function renderTree(tree, query) {
      if (tree.length === 0) {
        const icon = query ? 'search-stop' : 'inbox';
        const msg  = query ? 'No results found' : 'No sessions saved yet';
        treeDiv.innerHTML =
          '<div class="empty">'
          + '<i class="codicon codicon-' + icon + '"></i>'
          + '<p>' + esc(msg) + '</p>'
          + '</div>';
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
        + '<i class="codicon codicon-folder"></i>'
        + esc(p.name)
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
        + '<i class="codicon codicon-git-branch"></i>'
        + esc(b.name)
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
        + '<button class="btn-del"  title="Delete"><i class="codicon codicon-trash"></i></button>'
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