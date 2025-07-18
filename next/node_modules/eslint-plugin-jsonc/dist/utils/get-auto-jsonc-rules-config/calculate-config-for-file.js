"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfigForFile = void 0;
const synckit_1 = require("synckit");
const getSync = (0, synckit_1.createSyncFn)(require.resolve("./worker"));
function calculateConfigForFile(cwd, fileName) {
    return getSync(cwd, fileName);
}
exports.calculateConfigForFile = calculateConfigForFile;
