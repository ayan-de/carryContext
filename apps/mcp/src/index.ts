#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { saveContextTool } from './tools/save.js';
import { loadContextTool } from './tools/load.js';
import { listSessionsTool } from './tools/list.js';
import { searchContextTool } from './tools/search.js';
import { getStatusTool } from './tools/status.js';
import { clearContextTool } from './tools/clear.js';
import { deleteSessionTool } from './tools/delete.js';

const server = new FastMCP({
  name: 'contextcarry',
  version: '0.1.0',
});

server.addTool(saveContextTool);
server.addTool(loadContextTool);
server.addTool(listSessionsTool);
server.addTool(searchContextTool);
server.addTool(getStatusTool);
server.addTool(clearContextTool);
server.addTool(deleteSessionTool);

server.start({ transportType: 'stdio' });
