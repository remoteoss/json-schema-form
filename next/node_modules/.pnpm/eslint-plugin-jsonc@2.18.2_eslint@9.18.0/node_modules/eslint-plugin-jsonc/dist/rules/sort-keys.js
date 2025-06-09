"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const natural_compare_1 = __importDefault(require("natural-compare"));
const utils_1 = require("../utils");
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const jsonc_eslint_parser_1 = require("jsonc-eslint-parser");
function getPropertyName(node) {
    const prop = node.key;
    if (prop.type === "JSONIdentifier") {
        return prop.name;
    }
    return String((0, jsonc_eslint_parser_1.getStaticJSONValue)(prop));
}
class JSONPropertyData {
    get reportLoc() {
        return this.node.key.loc;
    }
    constructor(object, node, index) {
        this.cachedName = null;
        this.object = object;
        this.node = node;
        this.index = index;
    }
    get name() {
        var _a;
        return ((_a = this.cachedName) !== null && _a !== void 0 ? _a : (this.cachedName = getPropertyName(this.node)));
    }
    getPrev() {
        const prevIndex = this.index - 1;
        return prevIndex >= 0 ? this.object.properties[prevIndex] : null;
    }
}
class JSONObjectData {
    constructor(node) {
        this.cachedProperties = null;
        this.node = node;
    }
    get properties() {
        var _a;
        return ((_a = this.cachedProperties) !== null && _a !== void 0 ? _a : (this.cachedProperties = this.node.properties.map((e, index) => new JSONPropertyData(this, e, index))));
    }
    getPath() {
        let path = "";
        let curr = this.node;
        let p = curr.parent;
        while (p) {
            if (p.type === "JSONProperty") {
                const name = getPropertyName(p);
                if (/^[$a-z_][\w$]*$/iu.test(name)) {
                    path = `.${name}${path}`;
                }
                else {
                    path = `[${JSON.stringify(name)}]${path}`;
                }
                curr = p.parent;
            }
            else if (p.type === "JSONArrayExpression") {
                const index = p.elements.indexOf(curr);
                path = `[${index}]${path}`;
                curr = p;
            }
            else if (p.type === "JSONExpressionStatement") {
                break;
            }
            else {
                curr = p;
            }
            p = curr.parent;
        }
        if (path.startsWith(".")) {
            path = path.slice(1);
        }
        return path;
    }
}
function isCompatibleWithESLintOptions(options) {
    if (options.length === 0) {
        return true;
    }
    if (typeof options[0] === "string" || options[0] == null) {
        return true;
    }
    return false;
}
function buildValidatorFromType(order, insensitive, natural) {
    let compare = natural
        ? ([a, b]) => (0, natural_compare_1.default)(a, b) <= 0
        : ([a, b]) => a <= b;
    if (insensitive) {
        const baseCompare = compare;
        compare = ([a, b]) => baseCompare([a.toLowerCase(), b.toLowerCase()]);
    }
    if (order === "desc") {
        const baseCompare = compare;
        compare = (args) => baseCompare(args.reverse());
    }
    return (a, b) => compare([a.name, b.name]);
}
function parseOptions(options) {
    var _a, _b, _c;
    if (isCompatibleWithESLintOptions(options)) {
        const type = (_a = options[0]) !== null && _a !== void 0 ? _a : "asc";
        const obj = (_b = options[1]) !== null && _b !== void 0 ? _b : {};
        const insensitive = obj.caseSensitive === false;
        const natural = Boolean(obj.natural);
        const minKeys = (_c = obj.minKeys) !== null && _c !== void 0 ? _c : 2;
        const allowLineSeparatedGroups = obj.allowLineSeparatedGroups || false;
        return [
            {
                isTargetObject: (node) => node.properties.length >= minKeys,
                ignore: () => false,
                isValidOrder: buildValidatorFromType(type, insensitive, natural),
                orderText: `${natural ? "natural " : ""}${insensitive ? "insensitive " : ""}${type}ending`,
                allowLineSeparatedGroups,
            },
        ];
    }
    return options.map((opt) => {
        var _a, _b, _c, _d, _e;
        const order = opt.order;
        const pathPattern = new RegExp(opt.pathPattern);
        const hasProperties = (_a = opt.hasProperties) !== null && _a !== void 0 ? _a : [];
        const minKeys = (_b = opt.minKeys) !== null && _b !== void 0 ? _b : 2;
        const allowLineSeparatedGroups = opt.allowLineSeparatedGroups || false;
        if (!Array.isArray(order)) {
            const type = (_c = order.type) !== null && _c !== void 0 ? _c : "asc";
            const insensitive = order.caseSensitive === false;
            const natural = Boolean(order.natural);
            return {
                isTargetObject,
                ignore: () => false,
                isValidOrder: buildValidatorFromType(type, insensitive, natural),
                orderText: `${natural ? "natural " : ""}${insensitive ? "insensitive " : ""}${type}ending`,
                allowLineSeparatedGroups,
            };
        }
        const parsedOrder = [];
        for (const o of order) {
            if (typeof o === "string") {
                parsedOrder.push({
                    test: (data) => data.name === o,
                    isValidNestOrder: () => true,
                });
            }
            else {
                const keyPattern = o.keyPattern ? new RegExp(o.keyPattern) : null;
                const nestOrder = (_d = o.order) !== null && _d !== void 0 ? _d : {};
                const type = (_e = nestOrder.type) !== null && _e !== void 0 ? _e : "asc";
                const insensitive = nestOrder.caseSensitive === false;
                const natural = Boolean(nestOrder.natural);
                parsedOrder.push({
                    test: (data) => (keyPattern ? keyPattern.test(data.name) : true),
                    isValidNestOrder: buildValidatorFromType(type, insensitive, natural),
                });
            }
        }
        return {
            isTargetObject,
            ignore: (data) => parsedOrder.every((p) => !p.test(data)),
            isValidOrder(a, b) {
                for (const p of parsedOrder) {
                    const matchA = p.test(a);
                    const matchB = p.test(b);
                    if (!matchA || !matchB) {
                        if (matchA) {
                            return true;
                        }
                        if (matchB) {
                            return false;
                        }
                        continue;
                    }
                    return p.isValidNestOrder(a, b);
                }
                return false;
            },
            orderText: "specified",
            allowLineSeparatedGroups,
        };
        function isTargetObject(data) {
            if (data.node.properties.length < minKeys) {
                return false;
            }
            if (hasProperties.length > 0) {
                const names = new Set(data.properties.map((p) => p.name));
                if (!hasProperties.every((name) => names.has(name))) {
                    return false;
                }
            }
            return pathPattern.test(data.getPath());
        }
    });
}
const ALLOW_ORDER_TYPES = ["asc", "desc"];
const ORDER_OBJECT_SCHEMA = {
    type: "object",
    properties: {
        type: {
            enum: ALLOW_ORDER_TYPES,
        },
        caseSensitive: {
            type: "boolean",
        },
        natural: {
            type: "boolean",
        },
    },
    additionalProperties: false,
};
exports.default = (0, utils_1.createRule)("sort-keys", {
    meta: {
        docs: {
            description: "require object keys to be sorted",
            recommended: null,
            extensionRule: false,
            layout: false,
        },
        fixable: "code",
        schema: {
            oneOf: [
                {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            pathPattern: { type: "string" },
                            hasProperties: {
                                type: "array",
                                items: { type: "string" },
                            },
                            order: {
                                oneOf: [
                                    {
                                        type: "array",
                                        items: {
                                            anyOf: [
                                                { type: "string" },
                                                {
                                                    type: "object",
                                                    properties: {
                                                        keyPattern: {
                                                            type: "string",
                                                        },
                                                        order: ORDER_OBJECT_SCHEMA,
                                                    },
                                                    additionalProperties: false,
                                                },
                                            ],
                                        },
                                        uniqueItems: true,
                                    },
                                    ORDER_OBJECT_SCHEMA,
                                ],
                            },
                            minKeys: {
                                type: "integer",
                                minimum: 2,
                            },
                            allowLineSeparatedGroups: {
                                type: "boolean",
                            },
                        },
                        required: ["pathPattern", "order"],
                        additionalProperties: false,
                    },
                    minItems: 1,
                },
                {
                    type: "array",
                    items: [
                        {
                            enum: ALLOW_ORDER_TYPES,
                        },
                        {
                            type: "object",
                            properties: {
                                caseSensitive: {
                                    type: "boolean",
                                },
                                natural: {
                                    type: "boolean",
                                },
                                minKeys: {
                                    type: "integer",
                                    minimum: 2,
                                },
                                allowLineSeparatedGroups: {
                                    type: "boolean",
                                },
                            },
                            additionalProperties: false,
                        },
                    ],
                    additionalItems: false,
                },
            ],
        },
        messages: {
            sortKeys: "Expected object keys to be in {{orderText}} order. '{{thisName}}' should be before '{{prevName}}'.",
        },
        type: "suggestion",
    },
    create(context) {
        const sourceCode = context.sourceCode;
        if (!sourceCode.parserServices.isJSON) {
            return {};
        }
        const parsedOptions = parseOptions(context.options);
        function verifyProperty(data, option) {
            if (option.ignore(data)) {
                return;
            }
            const prevList = [];
            let currTarget = data;
            let prevTarget;
            while ((prevTarget = currTarget.getPrev())) {
                if (option.allowLineSeparatedGroups) {
                    if (hasBlankLine(prevTarget, currTarget)) {
                        break;
                    }
                }
                if (!option.ignore(prevTarget)) {
                    prevList.push(prevTarget);
                }
                currTarget = prevTarget;
            }
            if (prevList.length === 0) {
                return;
            }
            const prev = prevList[0];
            if (!option.isValidOrder(prev, data)) {
                context.report({
                    loc: data.reportLoc,
                    messageId: "sortKeys",
                    data: {
                        thisName: data.name,
                        prevName: prev.name,
                        orderText: option.orderText,
                    },
                    *fix(fixer) {
                        let moveTarget = prevList[0];
                        for (const prev of prevList) {
                            if (option.isValidOrder(prev, data)) {
                                break;
                            }
                            else {
                                moveTarget = prev;
                            }
                        }
                        const beforeToken = sourceCode.getTokenBefore(data.node);
                        const afterToken = sourceCode.getTokenAfter(data.node);
                        const hasAfterComma = (0, eslint_utils_1.isCommaToken)(afterToken);
                        const codeStart = beforeToken.range[1];
                        const codeEnd = hasAfterComma
                            ? afterToken.range[1]
                            : data.node.range[1];
                        const removeStart = hasAfterComma
                            ? codeStart
                            : beforeToken.range[0];
                        const insertCode = sourceCode.text.slice(codeStart, codeEnd) +
                            (hasAfterComma ? "" : ",");
                        const insertTarget = sourceCode.getTokenBefore(moveTarget.node);
                        let insertRange = insertTarget.range;
                        const insertNext = sourceCode.getTokenAfter(insertTarget, {
                            includeComments: true,
                        });
                        if (insertNext.loc.start.line - insertTarget.loc.end.line > 1) {
                            const offset = sourceCode.getIndexFromLoc({
                                line: insertNext.loc.start.line - 1,
                                column: 0,
                            });
                            insertRange = [offset, offset];
                        }
                        yield fixer.insertTextAfterRange(insertRange, insertCode);
                        yield fixer.removeRange([removeStart, codeEnd]);
                    },
                });
            }
        }
        function hasBlankLine(prev, next) {
            const tokenOrNodes = [
                ...sourceCode.getTokensBetween(prev.node, next.node, {
                    includeComments: true,
                }),
                next.node,
            ];
            let prevLoc = prev.node.loc;
            for (const t of tokenOrNodes) {
                const loc = t.loc;
                if (loc.start.line - prevLoc.end.line > 1) {
                    return true;
                }
                prevLoc = loc;
            }
            return false;
        }
        return {
            JSONObjectExpression(node) {
                const data = new JSONObjectData(node);
                const option = parsedOptions.find((o) => o.isTargetObject(data));
                if (!option) {
                    return;
                }
                for (const prop of data.properties) {
                    verifyProperty(prop, option);
                }
            },
        };
    },
});
