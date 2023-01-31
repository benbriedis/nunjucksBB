import lib from './src/lib';
import { Environment, Template } from './src/environment';
import Loader from './src/loader';
import installJinjaCompat from './src/jinja-compat';
declare function configure(templatesPath?: any, opts?: any): any;
declare function reset(): void;
declare function compile(src: any, env: any, path: any, eagerCompile: any): Template;
declare function render(name: any, ctx: any, cb?: any): any;
declare function renderString(src: any, ctx: any, cb: any): any;
declare const _default: {
    Environment: typeof Environment;
    Template: typeof Template;
    Loader: typeof Loader;
    FileSystemLoader: typeof import("./src/node-loaders").FileSystemLoader;
    NodeResolveLoader: typeof import("./src/node-loaders").NodeResolveLoader;
    PrecompiledLoader: typeof import("./src/precompiled-loader").PrecompiledLoader;
    WebLoader: typeof import("./src/web-loaders").WebLoader;
    compiler: {
        compile: (src: any, asyncFilters: any, extensions: any, name: any, opts?: {}) => string;
        Compiler: typeof import("./src/compiler").Compiler;
    };
    parser: {
        parse: (src: any, extensions: any, opts: any) => any;
        Parser: typeof import("./src/parser").Parser;
    };
    lexer: {
        lex(src: any, opts: any): import("./src/lexer").Tokenizer;
        TOKEN_STRING: string;
        TOKEN_WHITESPACE: string;
        TOKEN_DATA: string;
        TOKEN_BLOCK_START: string;
        TOKEN_BLOCK_END: string;
        TOKEN_VARIABLE_START: string;
        TOKEN_VARIABLE_END: string;
        TOKEN_COMMENT: string;
        TOKEN_LEFT_PAREN: string;
        TOKEN_RIGHT_PAREN: string;
        TOKEN_LEFT_BRACKET: string;
        TOKEN_RIGHT_BRACKET: string;
        TOKEN_LEFT_CURLY: string;
        TOKEN_RIGHT_CURLY: string;
        TOKEN_OPERATOR: string;
        TOKEN_COMMA: string;
        TOKEN_COLON: string;
        TOKEN_TILDE: string;
        TOKEN_PIPE: string;
        TOKEN_INT: string;
        TOKEN_FLOAT: string;
        TOKEN_BOOLEAN: string;
        TOKEN_NONE: string;
        TOKEN_SYMBOL: string;
        TOKEN_SPECIAL: string;
        TOKEN_REGEX: string;
    };
    runtime: {
        Frame: typeof import("./src/runtime").Frame;
        makeMacro: typeof import("./src/runtime").makeMacro;
        makeKeywordArgs: typeof import("./src/runtime").makeKeywordArgs;
        numArgs: typeof import("./src/runtime").numArgs;
        suppressValue: typeof import("./src/runtime").suppressValue;
        ensureDefined: typeof import("./src/runtime").ensureDefined;
        memberLookup: typeof import("./src/runtime").memberLookup;
        contextOrFrameLookup: typeof import("./src/runtime").contextOrFrameLookup;
        callWrap: typeof import("./src/runtime").callWrap;
        handleError: typeof import("./src/runtime").handleError;
        isArray: typeof lib.isArray;
        keys: typeof lib.keys;
        SafeString: typeof import("./src/runtime").SafeString;
        copySafeness: typeof import("./src/runtime").copySafeness;
        markSafe: typeof import("./src/runtime").markSafe;
        asyncEach: typeof import("./src/runtime").asyncEach;
        asyncAll: typeof import("./src/runtime").asyncAll;
        inOperator: typeof lib.inOperator;
        fromIterator: typeof import("./src/runtime").fromIterator;
    };
    lib: typeof lib;
    nodes: {
        Node: typeof import("./src/nodes").Node;
        Root: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        NodeList: typeof import("./src/nodes").NodeList;
        Value: typeof import("./src/nodes").Value;
        Literal: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Symbol: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Group: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Array: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Pair: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Dict: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Output: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Capture: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        TemplateData: any;
        If: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        IfAsync: any;
        InlineIf: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        For: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        AsyncEach: any;
        AsyncAll: any;
        Macro: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Caller: any;
        Import: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        FromImport: typeof import("./src/nodes").FromImport;
        FunCall: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Filter: any;
        FilterAsync: any;
        KeywordArgs: any;
        Block: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Super: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Extends: any;
        Include: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Set: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Switch: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        Case: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        LookupVal: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        BinOp: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        In: any;
        Is: any;
        Or: any;
        And: any;
        Not: any;
        Add: any;
        Concat: any;
        Sub: any;
        Mul: any;
        Div: any;
        FloorDiv: any;
        Mod: any;
        Pow: any;
        Neg: any;
        Pos: any;
        Compare: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        CompareOperand: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        CallExtension: {
            new (...args: any[]): {
                [x: string]: any;
                readonly typename: any;
            };
            [x: string]: any;
        };
        CallExtensionAsync: any;
        printNodes: typeof import("./src/nodes").printNodes;
    };
    installJinjaCompat: typeof installJinjaCompat;
    configure: typeof configure;
    reset: typeof reset;
    compile: typeof compile;
    render: typeof render;
    renderString: typeof renderString;
    precompile: (input: any, opts: any) => any;
    precompileString: (str: any, opts: any) => any;
};
export default _default;
//# sourceMappingURL=index.d.ts.map