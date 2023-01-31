import { Obj2 } from './object';
export declare class Node extends Obj2 {
    lineno: any;
    colno: any;
    get fields(): any[];
    constructor(lineno: any, colno: any, ...args: any[]);
    findAll(type: any, results: any): any;
    iterFields(func: any): void;
}
export declare class Value extends Node {
    get typename(): string;
    get fields(): string[];
}
export declare class NodeList extends Node {
    get typename(): string;
    get fields(): string[];
    constructor(lineno?: any, colno?: any, nodes?: any);
    addChild(node: any): void;
}
declare class Root extends NodeList {
    get typename(): string;
}
declare class Literal extends Value {
    get typename(): string;
}
declare class Symbol extends Value {
    get typename(): string;
}
declare class Group extends NodeList {
    get typename(): string;
}
declare class ArrayNode extends NodeList {
    get typename(): string;
}
declare class Pair extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Dict extends NodeList {
    get typename(): string;
}
declare class LookupVal extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class If extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class IfAsync extends If {
    get typename(): string;
}
declare class InlineIf extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class For extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class AsyncEach extends For {
    get typename(): string;
}
declare class AsyncAll extends For {
    get typename(): string;
}
declare class Macro extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Caller extends Macro {
    get typename(): string;
}
declare class Import extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class FromImport extends Node {
    get typename(): string;
    get fields(): string[];
    constructor(lineno: any, colno: any, template: any, names: any, withContext: any);
}
declare class FunCall extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Filter extends FunCall {
    get typename(): string;
}
declare class FilterAsync extends Filter {
    get typename(): string;
    get fields(): string[];
}
declare class KeywordArgs extends Dict {
    get typename(): string;
}
declare class Block extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Super extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class TemplateRef extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Extends extends TemplateRef {
    get typename(): string;
}
declare class Include extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Set extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Switch extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Case extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class Output extends NodeList {
    get typename(): string;
}
declare class Capture extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class TemplateData extends Literal {
    get typename(): string;
}
declare class UnaryOp extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class BinOp extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class In extends BinOp {
    get typename(): string;
}
declare class Is extends BinOp {
    get typename(): string;
}
declare class Or extends BinOp {
    get typename(): string;
}
declare class And extends BinOp {
    get typename(): string;
}
declare class Not extends UnaryOp {
    get typename(): string;
}
declare class Add extends BinOp {
    get typename(): string;
}
declare class Concat extends BinOp {
    get typename(): string;
}
declare class Sub extends BinOp {
    get typename(): string;
}
declare class Mul extends BinOp {
    get typename(): string;
}
declare class Div extends BinOp {
    get typename(): string;
}
declare class FloorDiv extends BinOp {
    get typename(): string;
}
declare class Mod extends BinOp {
    get typename(): string;
}
declare class Pow extends BinOp {
    get typename(): string;
}
declare class Neg extends UnaryOp {
    get typename(): string;
}
declare class Pos extends UnaryOp {
    get typename(): string;
}
declare class Compare extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class CompareOperand extends Node {
    get typename(): string;
    get fields(): string[];
}
declare class CallExtension extends Node {
    extName: any;
    prop: any;
    args: any;
    contentArgs: any;
    autoescape: any;
    constructor(lineno: any, colno: any, ext: any, prop: any, args: any, contentArgs: any);
    get fields(): string[];
    get typename(): string;
}
declare class CallExtensionAsync extends CallExtension {
    get typename(): string;
}
declare function printNodes(node: any, indent: any): void;
declare const _default: {
    Node: typeof Node;
    Root: typeof Root;
    NodeList: typeof NodeList;
    Value: typeof Value;
    Literal: typeof Literal;
    Symbol: typeof Symbol;
    Group: typeof Group;
    Array: typeof ArrayNode;
    Pair: typeof Pair;
    Dict: typeof Dict;
    Output: typeof Output;
    Capture: typeof Capture;
    TemplateData: typeof TemplateData;
    If: typeof If;
    IfAsync: typeof IfAsync;
    InlineIf: typeof InlineIf;
    For: typeof For;
    AsyncEach: typeof AsyncEach;
    AsyncAll: typeof AsyncAll;
    Macro: typeof Macro;
    Caller: typeof Caller;
    Import: typeof Import;
    FromImport: typeof FromImport;
    FunCall: typeof FunCall;
    Filter: typeof Filter;
    FilterAsync: typeof FilterAsync;
    KeywordArgs: typeof KeywordArgs;
    Block: typeof Block;
    Super: typeof Super;
    Extends: typeof Extends;
    Include: typeof Include;
    Set: typeof Set;
    Switch: typeof Switch;
    Case: typeof Case;
    LookupVal: typeof LookupVal;
    BinOp: typeof BinOp;
    In: typeof In;
    Is: typeof Is;
    Or: typeof Or;
    And: typeof And;
    Not: typeof Not;
    Add: typeof Add;
    Concat: typeof Concat;
    Sub: typeof Sub;
    Mul: typeof Mul;
    Div: typeof Div;
    FloorDiv: typeof FloorDiv;
    Mod: typeof Mod;
    Pow: typeof Pow;
    Neg: typeof Neg;
    Pos: typeof Pos;
    Compare: typeof Compare;
    CompareOperand: typeof CompareOperand;
    CallExtension: typeof CallExtension;
    CallExtensionAsync: typeof CallExtensionAsync;
    printNodes: typeof printNodes;
};
export default _default;
//# sourceMappingURL=nodes.d.ts.map