"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExactConverter = exports.getConverter = exports.getChecker = exports.isPascalCase = exports.pascalCase = exports.isCamelCase = exports.camelCase = exports.isScreamingSnakeCase = exports.screamingSnakeCase = exports.isSnakeCase = exports.snakeCase = exports.isKebabCase = exports.kebabCase = exports.allowedCaseOptions = void 0;
exports.allowedCaseOptions = [
    "camelCase",
    "kebab-case",
    "PascalCase",
    "snake_case",
    "SCREAMING_SNAKE_CASE",
];
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function hasSymbols(str) {
    return /[\u0021-\u0023\u0025-\u002c./\u003a-\u0040\u005b-\u005e`\u007b-\u007d]/u.test(str);
}
function hasUpper(str) {
    return /[A-Z]/u.test(str);
}
function hasLower(str) {
    return /[a-z]/u.test(str);
}
function kebabCase(str) {
    let res = str.replace(/_/gu, "-");
    if (hasLower(res)) {
        res = res.replace(/\B([A-Z])/gu, "-$1");
    }
    return res.toLowerCase();
}
exports.kebabCase = kebabCase;
function isKebabCase(str) {
    if (hasUpper(str) ||
        hasSymbols(str) ||
        str.startsWith("-") ||
        /_|--|\s/u.test(str)) {
        return false;
    }
    return true;
}
exports.isKebabCase = isKebabCase;
function snakeCase(str) {
    let res = str.replace(/-/gu, "_");
    if (hasLower(res)) {
        res = res.replace(/\B([A-Z])/gu, "_$1");
    }
    return res.toLowerCase();
}
exports.snakeCase = snakeCase;
function isSnakeCase(str) {
    if (hasUpper(str) || hasSymbols(str) || /-|__|\s/u.test(str)) {
        return false;
    }
    return true;
}
exports.isSnakeCase = isSnakeCase;
function screamingSnakeCase(str) {
    let res = str.replace(/-/gu, "_");
    if (hasLower(res)) {
        res = res.replace(/\B([A-Z])/gu, "_$1");
    }
    return res.toUpperCase();
}
exports.screamingSnakeCase = screamingSnakeCase;
function isScreamingSnakeCase(str) {
    if (hasLower(str) || hasSymbols(str) || /-|__|\s/u.test(str)) {
        return false;
    }
    return true;
}
exports.isScreamingSnakeCase = isScreamingSnakeCase;
function camelCase(str) {
    if (isPascalCase(str)) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    let s = str;
    if (!hasLower(s)) {
        s = s.toLowerCase();
    }
    return s.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ""));
}
exports.camelCase = camelCase;
function isCamelCase(str) {
    if (hasSymbols(str) ||
        /^[A-Z]/u.test(str) ||
        /[\s\-_]/u.test(str)) {
        return false;
    }
    return true;
}
exports.isCamelCase = isCamelCase;
function pascalCase(str) {
    return capitalize(camelCase(str));
}
exports.pascalCase = pascalCase;
function isPascalCase(str) {
    if (hasSymbols(str) ||
        /^[a-z]/u.test(str) ||
        /[\s\-_]/u.test(str)) {
        return false;
    }
    return true;
}
exports.isPascalCase = isPascalCase;
const convertersMap = {
    "kebab-case": kebabCase,
    snake_case: snakeCase,
    SCREAMING_SNAKE_CASE: screamingSnakeCase,
    camelCase,
    PascalCase: pascalCase,
};
const checkersMap = {
    "kebab-case": isKebabCase,
    snake_case: isSnakeCase,
    SCREAMING_SNAKE_CASE: isScreamingSnakeCase,
    camelCase: isCamelCase,
    PascalCase: isPascalCase,
};
function getChecker(name) {
    return checkersMap[name] || isPascalCase;
}
exports.getChecker = getChecker;
function getConverter(name) {
    return convertersMap[name] || pascalCase;
}
exports.getConverter = getConverter;
function getExactConverter(name) {
    const converter = getConverter(name);
    const checker = getChecker(name);
    return (str) => {
        const result = converter(str);
        return checker(result) ? result : str;
    };
}
exports.getExactConverter = getExactConverter;
