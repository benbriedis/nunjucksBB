export class Parser extends Obj {
    init(tokens: any): void;
    tokens: any;
    peeked: any;
    breakOnBlocks: any;
    dropLeadingWhitespace: boolean;
    extensions: any[];
    nextToken(withWhitespace: any): any;
    peekToken(): any;
    pushToken(tok: any): void;
    error(msg: any, lineno: any, colno: any): any;
    fail(msg: any, lineno: any, colno: any): void;
    skip(type: any): boolean;
    expect(type: any): any;
    skipValue(type: any, val: any): boolean;
    skipSymbol(val: any): boolean;
    advanceAfterBlockEnd(name: any): any;
    advanceAfterVariableEnd(): void;
    parseFor(): any;
    parseMacro(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseCall(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseWithContext(): boolean;
    parseImport(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseFrom(): {
        readonly typename: string;
        readonly fields: string[];
        init(lineno: any, colno: any, template: any, names: any, withContext: any): void;
        lineno: any;
        colno: any;
        findAll(type: any, results: any): any;
        iterFields(func: any): void;
    };
    parseBlock(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseExtends(): any;
    parseInclude(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseIf(): any;
    parseSet(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseSwitch(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseStatement(): any;
    parseRaw(tagName: any): {
        [x: string]: any;
        readonly typename: any;
    };
    parsePostfix(node: any): any;
    parseExpression(): any;
    parseInlineIf(): any;
    parseOr(): any;
    parseAnd(): any;
    parseNot(): any;
    parseIn(): any;
    parseIs(): any;
    parseCompare(): any;
    parseConcat(): any;
    parseAdd(): any;
    parseSub(): any;
    parseMul(): any;
    parseDiv(): any;
    parseFloorDiv(): any;
    parseMod(): any;
    parsePow(): any;
    parseUnary(noFilters: any): any;
    parsePrimary(noPostfix: any): any;
    parseFilterName(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseFilterArgs(node: any): any;
    parseFilter(node: any): any;
    parseFilterStatement(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseAggregate(): {
        [x: string]: any;
        readonly typename: any;
    };
    parseSignature(tolerant: any, noParens: any): {
        readonly typename: string;
        readonly fields: string[];
        init(lineno: any, colno: any, nodes: any): void;
        addChild(node: any): void;
        lineno: any;
        colno: any;
        findAll(type: any, results: any): any;
        iterFields(func: any): void;
    };
    parseUntilBlocks(...blockNames: any[]): {
        readonly typename: string;
        readonly fields: string[];
        init(lineno: any, colno: any, nodes: any): void;
        addChild(node: any): void;
        lineno: any;
        colno: any;
        findAll(type: any, results: any): any;
        iterFields(func: any): void;
    };
    parseNodes(): any[];
    parse(): {
        readonly typename: string;
        readonly fields: string[];
        init(lineno: any, colno: any, nodes: any): void;
        addChild(node: any): void;
        lineno: any;
        colno: any;
        findAll(type: any, results: any): any;
        iterFields(func: any): void;
    };
    parseAsRoot(): {
        [x: string]: any;
        readonly typename: any;
    };
}
import Obj_1 = require("./object");
import Obj = Obj_1.Obj;
export declare function parse(src: any, extensions: any, opts: any): {
    [x: string]: any;
    readonly typename: any;
};
export declare function parse(src: any, extensions: any, opts: any): {
    [x: string]: any;
    readonly typename: any;
};
//# sourceMappingURL=parser.d.ts.map