declare class Tokenizer {
    constructor(str: any, opts: any);
    str: any;
    index: number;
    len: any;
    lineno: number;
    colno: number;
    in_code: boolean;
    tags: {
        BLOCK_START: any;
        BLOCK_END: any;
        VARIABLE_START: any;
        VARIABLE_END: any;
        COMMENT_START: any;
        COMMENT_END: any;
    };
    trimBlocks: boolean;
    lstripBlocks: boolean;
    nextToken(): any;
    _parseString(delimiter: any): string;
    _matches(str: any): boolean;
    _extractString(str: any): any;
    _extractUntil(charString: any): any;
    _extract(charString: any): any;
    _extractMatching(breakOnMatch: any, charString: any): any;
    _extractRegex(regex: any): any;
    isFinished(): boolean;
    forwardN(n: any): void;
    forward(): void;
    backN(n: any): void;
    back(): void;
    current(): any;
    currentStr(): any;
    previous(): any;
}
export let TOKEN_STRING: string;
export let TOKEN_WHITESPACE: string;
export let TOKEN_DATA: string;
export let TOKEN_BLOCK_START: string;
export let TOKEN_BLOCK_END: string;
export let TOKEN_VARIABLE_START: string;
export let TOKEN_VARIABLE_END: string;
export let TOKEN_COMMENT: string;
export let TOKEN_LEFT_PAREN: string;
export let TOKEN_RIGHT_PAREN: string;
export let TOKEN_LEFT_BRACKET: string;
export let TOKEN_RIGHT_BRACKET: string;
export let TOKEN_LEFT_CURLY: string;
export let TOKEN_RIGHT_CURLY: string;
export let TOKEN_OPERATOR: string;
export let TOKEN_COMMA: string;
export let TOKEN_COLON: string;
export let TOKEN_TILDE: string;
export let TOKEN_PIPE: string;
export let TOKEN_INT: string;
export let TOKEN_FLOAT: string;
export let TOKEN_BOOLEAN: string;
export let TOKEN_NONE: string;
export let TOKEN_SYMBOL: string;
export let TOKEN_SPECIAL: string;
export let TOKEN_REGEX: string;
export declare function lex(src: any, opts: any): Tokenizer;
export declare function lex(src: any, opts: any): Tokenizer;
export {};
//# sourceMappingURL=lexer.d.ts.map