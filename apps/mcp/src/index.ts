#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

const server = new FastMCP({
  name: 'contextcarry',
  version: '0.1.0',
});

// Tools will be registered in subsequent steps (3.4–3.10)

server.start({ transportType: 'stdio' });
