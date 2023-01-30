export class Node extends Obj {
    init(lineno: any, colno: any, ...args: any[]): void;
    lineno: any;
    colno: any;
    findAll(type: any, results: any): any;
    iterFields(func: any): void;
}
export const Root: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export class NodeList extends Node {
    get fields(): string[];
    init(lineno: any, colno: any, nodes: any): void;
    addChild(node: any): void;
}
export class Value extends Node {
    get fields(): string[];
}
export const Literal: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Symbol: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Group: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
declare const ArrayNode: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Pair: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Dict: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Output: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Capture: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const TemplateData: any;
export const If: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const IfAsync: any;
export const InlineIf: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const For: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const AsyncEach: any;
export const AsyncAll: any;
export const Macro: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Caller: any;
export const Import: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export class FromImport extends Node {
    get fields(): string[];
    init(lineno: any, colno: any, template: any, names: any, withContext: any): void;
}
export const FunCall: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Filter: any;
export const FilterAsync: any;
export const KeywordArgs: any;
export const Block: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Super: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Extends: any;
export const Include: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Set: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Switch: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Case: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const LookupVal: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const BinOp: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const In: any;
export const Is: any;
export const Or: any;
export const And: any;
export const Not: any;
export const Add: any;
export const Concat: any;
export const Sub: any;
export const Mul: any;
export const Div: any;
export const FloorDiv: any;
export const Mod: any;
export const Pow: any;
export const Neg: any;
export const Pos: any;
export const Compare: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CompareOperand: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CallExtension: {
    new (): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CallExtensionAsync: any;
export function printNodes(node: any, indent: any): void;
import { Obj } from "./object";
export { ArrayNode as Array };
//# sourceMappingURL=nodes.d.ts.map