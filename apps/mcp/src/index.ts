#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { saveContextTool } from './tools/save.js';

const server = new FastMCP({
  name: 'contextcarry',
  version: '0.1.0',
});

// Tools (registered in steps 3.4–3.10)
server.addTool(saveContextTool);

server.start({ transportType: 'stdio' });
