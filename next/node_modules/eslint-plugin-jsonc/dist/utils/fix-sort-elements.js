"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixForSorting = void 0;
const eslint_utils_1 = require("@eslint-community/eslint-utils");
function isComma(token) {
    return (0, eslint_utils_1.isCommaToken)(token);
}
function isClosingBrace(token) {
    return (0, eslint_utils_1.isClosingBraceToken)(token);
}
function isClosingBracket(token) {
    return (0, eslint_utils_1.isClosingBracketToken)(token);
}
function* fixForSorting(fixer, sourceCode, target, to) {
    const targetInfo = calcTargetInfo(sourceCode, target);
    const toPrevInfo = getPrevElementInfo(sourceCode, to);
    if (toPrevInfo.comma &&
        toPrevInfo.last.range[1] <= toPrevInfo.comma.range[0]) {
        yield fixer.removeRange(toPrevInfo.comma.range);
    }
    let insertRange = [
        toPrevInfo.last.range[1],
        toPrevInfo.last.range[1],
    ];
    const toBeforeNextToken = sourceCode.getTokenAfter(toPrevInfo.last, {
        includeComments: true,
    });
    if (toBeforeNextToken.loc.start.line - toPrevInfo.last.loc.end.line > 1) {
        const offset = sourceCode.getIndexFromLoc({
            line: toBeforeNextToken.loc.start.line - 1,
            column: 0,
        });
        insertRange = [offset, offset];
    }
    yield fixer.insertTextAfterRange(insertRange, targetInfo.insertCode);
    for (const removeRange of targetInfo.removeRanges) {
        yield fixer.removeRange(removeRange);
    }
}
exports.fixForSorting = fixForSorting;
function calcTargetInfo(sourceCode, target) {
    if (!target.node) {
        return calcTargetInfoFromAround(sourceCode, target);
    }
    const node = target.node;
    const nodeLastToken = getLastTokenOfNode(sourceCode, node);
    const endInfo = getElementEndInfo(sourceCode, node);
    const prevInfo = getPrevElementInfo(sourceCode, { node });
    let insertCode;
    const removeRanges = [];
    if (prevInfo.comma && prevInfo.last.range[1] <= prevInfo.comma.range[0]) {
        insertCode = `${sourceCode.text.slice(prevInfo.last.range[1], prevInfo.comma.range[0])}${sourceCode.text.slice(prevInfo.comma.range[1], nodeLastToken.range[1])}`;
        removeRanges.push([prevInfo.last.range[1], prevInfo.comma.range[0]], [prevInfo.comma.range[1], nodeLastToken.range[1]]);
    }
    else {
        insertCode = sourceCode.text.slice(prevInfo.last.range[1], nodeLastToken.range[1]);
        removeRanges.push([prevInfo.last.range[1], nodeLastToken.range[1]]);
    }
    const hasTrailingComma = endInfo.comma && endInfo.comma.range[1] <= endInfo.last.range[1];
    if (!hasTrailingComma) {
        insertCode += ",";
        if (prevInfo.comma) {
            removeRanges.push(prevInfo.comma.range);
        }
    }
    insertCode += sourceCode.text.slice(nodeLastToken.range[1], endInfo.last.range[1]);
    removeRanges.push([nodeLastToken.range[1], endInfo.last.range[1]]);
    return {
        insertCode,
        removeRanges,
    };
}
function calcTargetInfoFromAround(sourceCode, target) {
    const hasTrailingComma = isComma(target.after);
    const codeStart = target.before.range[1];
    let codeEnd;
    if (hasTrailingComma) {
        codeEnd = target.after.range[1];
    }
    else {
        codeEnd = target.after.range[0];
    }
    let removeStart = codeStart;
    if (!hasTrailingComma) {
        removeStart = target.before.range[0];
    }
    return {
        insertCode: sourceCode.text.slice(codeStart, codeEnd) + (hasTrailingComma ? "" : ","),
        removeRanges: [[removeStart, codeEnd]],
    };
}
function getFirstTokenOfNode(sourceCode, node) {
    let token = sourceCode.getFirstToken(node);
    let target = token;
    while ((target = sourceCode.getTokenBefore(target)) &&
        (0, eslint_utils_1.isOpeningParenToken)(target)) {
        token = target;
    }
    return token;
}
function getLastTokenOfNode(sourceCode, node) {
    let token = sourceCode.getLastToken(node);
    let target = token;
    while ((target = sourceCode.getTokenAfter(target)) &&
        (0, eslint_utils_1.isClosingParenToken)(target)) {
        token = target;
    }
    return token;
}
function getElementEndInfo(sourceCode, node) {
    const lastToken = getLastTokenOfNode(sourceCode, node);
    const afterToken = sourceCode.getTokenAfter(lastToken);
    if ((0, eslint_utils_1.isNotCommaToken)(afterToken)) {
        return {
            comma: null,
            nextElement: null,
            last: getLastTokenWithTrailingComments(),
        };
    }
    const comma = afterToken;
    const nextElement = sourceCode.getTokenAfter(afterToken);
    if (isComma(nextElement)) {
        return {
            comma,
            nextElement: null,
            last: comma,
        };
    }
    if (isClosingBrace(nextElement) || isClosingBracket(nextElement)) {
        return {
            comma,
            nextElement: null,
            last: getLastTokenWithTrailingComments(),
        };
    }
    if (node.loc.end.line === nextElement.loc.start.line) {
        return {
            comma,
            nextElement,
            last: comma,
        };
    }
    if (node.loc.end.line < comma.loc.start.line &&
        comma.loc.end.line < nextElement.loc.start.line) {
        return {
            comma,
            nextElement,
            last: comma,
        };
    }
    return {
        comma,
        nextElement,
        last: getLastTokenWithTrailingComments(),
    };
    function getLastTokenWithTrailingComments() {
        if (lastToken == null)
            return afterToken;
        let last = lastToken;
        let after = sourceCode.getTokenAfter(lastToken, {
            includeComments: true,
        });
        while (((0, eslint_utils_1.isCommentToken)(after) || isComma(after)) &&
            node.loc.end.line === after.loc.end.line) {
            last = after;
            after = sourceCode.getTokenAfter(after, {
                includeComments: true,
            });
        }
        return last;
    }
}
function getPrevElementInfo(sourceCode, target) {
    const beforeToken = target.node
        ? sourceCode.getTokenBefore(getFirstTokenOfNode(sourceCode, target.node))
        : target.before;
    if ((0, eslint_utils_1.isNotCommaToken)(beforeToken)) {
        return {
            comma: null,
            prevElement: null,
            last: beforeToken,
        };
    }
    const comma = beforeToken;
    const prevElement = sourceCode.getTokenBefore(beforeToken);
    if (isComma(prevElement)) {
        return {
            comma,
            prevElement: null,
            last: comma,
        };
    }
    const endInfo = getElementEndInfo(sourceCode, prevElement);
    return {
        comma: endInfo.comma,
        prevElement,
        last: endInfo.last,
    };
}
