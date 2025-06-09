export { COMMANDS, constructCommand, resolveCommand } from './commands.mjs';
export { AGENTS, INSTALL_PAGE, LOCKS } from './constants.mjs';
export { detect, detectSync, getUserAgent } from './detect.mjs';
import 'node:fs';
import 'node:fs/promises';
import 'node:path';
import 'node:process';
