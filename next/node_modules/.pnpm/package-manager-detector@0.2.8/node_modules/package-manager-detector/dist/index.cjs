'use strict';

const commands = require('./commands.cjs');
const constants = require('./constants.cjs');
const detect = require('./detect.cjs');
require('node:fs');
require('node:fs/promises');
require('node:path');
require('node:process');



exports.COMMANDS = commands.COMMANDS;
exports.constructCommand = commands.constructCommand;
exports.resolveCommand = commands.resolveCommand;
exports.AGENTS = constants.AGENTS;
exports.INSTALL_PAGE = constants.INSTALL_PAGE;
exports.LOCKS = constants.LOCKS;
exports.detect = detect.detect;
exports.detectSync = detect.detectSync;
exports.getUserAgent = detect.getUserAgent;
