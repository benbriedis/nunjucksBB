export function print(str: any, indent: any, inline: any): void;
export function printNodes(node: any, indent: any): void;
export class Node extends Obj {
    init(lineno: any, colno: any, ...args: any[]): void;
    lineno: any;
    colno: any;
    findAll(type: any, results: any): any;
    iterFields(func: any): void;
}
export class Value extends Node {
    get fields(): string[];
}
export class NodeList extends Node {
    get fields(): string[];
    init(lineno: any, colno: any, nodes: any): void;
    addChild(node: any): void;
}
export const Root: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Literal: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Symbol: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Group: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const ArrayNode: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Pair: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Dict: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const LookupVal: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const If: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const IfAsync: any;
export const InlineIf: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const For: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const AsyncEach: any;
export const AsyncAll: any;
export const Macro: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Caller: any;
export const Import: {
    new (...args: any[]): {
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
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Filter: any;
export const FilterAsync: any;
export const KeywordArgs: any;
export const Block: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Super: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const TemplateRef: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Extends: any;
export const Include: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Set: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Switch: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Case: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Output: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const Capture: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const TemplateData: any;
export const UnaryOp: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const BinOp: {
    new (...args: any[]): {
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
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CompareOperand: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CallExtension: {
    new (...args: any[]): {
        [x: string]: any;
        readonly typename: any;
    };
    [x: string]: any;
};
export const CallExtensionAsync: any;
declare namespace _default {
    export { Node };
    export { Root };
    export { NodeList };
    export { Value };
    export { Literal };
    export { Symbol };
    export { Group };
    export { ArrayNode as Array };
    export { Pair };
    export { Dict };
    export { Output };
    export { Capture };
    export { TemplateData };
    export { If };
    export { IfAsync };
    export { InlineIf };
    export { For };
    export { AsyncEach };
    export { AsyncAll };
    export { Macro };
    export { Caller };
    export { Import };
    export { FromImport };
    export { FunCall };
    export { Filter };
    export { FilterAsync };
    export { KeywordArgs };
    export { Block };
    export { Super };
    export { Extends };
    export { Include };
    export { Set };
    export { Switch };
    export { Case };
    export { LookupVal };
    export { BinOp };
    export { In };
    export { Is };
    export { Or };
    export { And };
    export { Not };
    export { Add };
    export { Concat };
    export { Sub };
    export { Mul };
    export { Div };
    export { FloorDiv };
    export { Mod };
    export { Pow };
    export { Neg };
    export { Pos };
    export { Compare };
    export { CompareOperand };
    export { CallExtension };
    export { CallExtensionAsync };
    export { printNodes };
}
export default _default;
import { Obj } from "./object";
//# sourceMappingURL=nodes.d.ts.map