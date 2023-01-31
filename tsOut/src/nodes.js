'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeList = exports.Value = exports.Node = void 0;
const object_1 = require("./object");
function traverseAndCheck(obj, type, results) {
    if (obj instanceof type)
        results.push(obj);
    if (obj instanceof Node)
        obj.findAll(type, results);
}
class Node extends object_1.Obj2 {
    lineno;
    colno;
    get fields() { return []; } //XXX I'd rather fields were not dynamically added
    constructor(lineno, colno, ...args) {
        super();
        this.lineno = lineno;
        this.colno = colno;
        this.fields.forEach((field, i) => {
            // The first two args are line/col numbers, so offset by 2
            var val = arguments[i + 2];
            // Fields should never be undefined, but null. It makes
            // testing easier to normalize values.
            if (val === undefined)
                val = null;
            this[field] = val;
        });
    }
    findAll(type, results) {
        results = results || [];
        if (this instanceof NodeList)
            //XXX 'children' is added as a dynamic field by NodeList
            this.children.forEach(child => traverseAndCheck(child, type, results));
        else
            this.fields.forEach(field => traverseAndCheck(this[field], type, results));
        return results;
    }
    iterFields(func) {
        this.fields.forEach((field) => {
            func(this[field], field);
        });
    }
}
exports.Node = Node;
// Abstract nodes
class Value extends Node {
    get typename() { return 'Value'; }
    get fields() { return ['value']; }
}
exports.Value = Value;
// Concrete nodes
class NodeList extends Node {
    get typename() { return 'NodeList'; }
    get fields() { return ['children']; }
    constructor(lineno = undefined, colno = undefined, nodes = undefined) {
        super(lineno, colno, nodes || []);
    }
    addChild(node) {
        this.children.push(node);
    }
}
exports.NodeList = NodeList;
class Root extends NodeList {
}
;
class Literal extends Value {
}
;
class Symbol extends Value {
}
;
class Group extends NodeList {
}
;
//class ArrayNode extends NodeList.extend('Array');     //FIXME divergent name and constant
class Array extends NodeList {
}
; //FIXME? may get in trouble for using this name...
class Pair extends Node {
    get fields() { return ['key', 'value']; }
}
;
class Dict extends NodeList {
}
;
class LookupVal extends Node {
    get fields() { return ['target', 'val']; }
}
;
class If extends Node {
    get fields() { return ['cond', 'body', 'else_']; }
}
;
class IfAsync extends If {
}
;
class InlineIf extends Node {
    get fields() { return ['cond', 'body', 'else_']; }
}
;
class For extends Node {
    get fields() { return ['arr', 'name', 'body', 'else_']; }
}
;
class AsyncEach extends For {
}
;
class AsyncAll extends For {
}
;
class Macro extends Node {
    get fields() { return ['name', 'args', 'body']; }
}
;
class Caller extends Macro {
}
;
class Import extends Node {
    get fields() { return ['template', 'target', 'withContext']; }
}
;
class FromImport extends Node {
    get typename() { return 'FromImport'; }
    get fields() { return ['template', 'names', 'withContext']; }
    constructor(lineno, colno, template, names, withContext) {
        super(lineno, colno, template, names || new NodeList(), withContext);
    }
}
class FunCall extends Node {
    get fields() { return ['name', 'args']; }
}
;
class Filter extends FunCall {
}
;
class FilterAsync extends Filter {
    get fields() { return ['name', 'args', 'symbol']; }
}
;
class KeywordArgs extends Dict {
}
;
class Block extends Node {
    get fields() { return ['name', 'body']; }
}
;
class Super extends Node {
    get fields() { return ['blockName', 'symbol']; }
}
;
class TemplateRef extends Node {
    get fields() { return ['template']; }
}
;
class Extends extends TemplateRef {
}
;
class Include extends Node {
    get fields() { return ['template', 'ignoreMissing']; }
}
;
class Set extends Node {
    get fields() { return ['targets', 'value']; }
}
;
class Switch extends Node {
    get fields() { return ['expr', 'cases', 'default']; }
}
;
class Case extends Node {
    get fields() { return ['cond', 'body']; }
}
;
class Output extends NodeList {
}
;
class Capture extends Node {
    get fields() { return ['body']; }
}
;
class TemplateData extends Literal {
}
;
class UnaryOp extends Node {
    get fields() { return ['target']; }
}
;
class BinOp extends Node {
    get fields() { return ['left', 'right']; }
}
;
class In extends BinOp {
}
;
class Is extends BinOp {
}
;
class Or extends BinOp {
}
;
class And extends BinOp {
}
;
class Not extends UnaryOp {
}
;
class Add extends BinOp {
}
;
class Concat extends BinOp {
}
;
class Sub extends BinOp {
}
;
class Mul extends BinOp {
}
;
class Div extends BinOp {
}
;
class FloorDiv extends BinOp {
}
;
class Mod extends BinOp {
}
;
class Pow extends BinOp {
}
;
class Neg extends UnaryOp {
}
;
class Pos extends UnaryOp {
}
;
class Compare extends Node {
    get fields() { return ['expr', 'ops']; }
}
;
class CompareOperand extends Node {
    get fields() { return ['expr', 'type']; }
}
;
/*
export const CallExtension = Node.extend('CallExtension', {
//FIXME use constructor
    init(ext, prop, args, contentArgs) {
        this.parent();
        this.extName = ext.__name || ext;
        this.prop = prop;
        this.args = args || new NodeList();
        this.contentArgs = contentArgs || [];
        this.autoescape = ext.autoescape;
    },
    fields: ['extName', 'prop', 'args', 'contentArgs']
});
*/
//XXX not sure if we can use this type of class extends
class CallExtension extends Node {
    extName;
    prop;
    args;
    contentArgs;
    autoescape;
    constructor(lineno, colno, ext, prop, args, contentArgs) {
        //constructor(lineno, colno, ...args) 
        super(lineno, colno, ext, prop, args, contentArgs);
        //		this.parent();
        this.extName = ext.__name || ext;
        this.prop = prop;
        this.args = args || new NodeList();
        this.contentArgs = contentArgs || [];
        this.autoescape = ext.autoescape;
    }
    get fields() { return ['extName', 'prop', 'args', 'contentArgs']; }
}
class CallExtensionAsync extends CallExtension {
}
;
// This is hacky, but this is just a debugging function anyway
function print(str, indent = undefined, inline = undefined) {
    var lines = str.split('\n');
    lines.forEach((line, i) => {
        if (line && ((inline && i > 0) || !inline))
            process.stdout.write((' ').repeat(indent));
        const nl = (i === lines.length - 1) ? '' : '\n';
        process.stdout.write(`${line}${nl}`);
    });
}
// Print the AST in a nicely formatted tree format for debuggin
function printNodes(node, indent) {
    indent = indent || 0;
    print(node.typename + ': ', indent);
    if (node instanceof NodeList) {
        print('\n');
        node.children.forEach((n) => {
            printNodes(n, indent + 2);
        });
    }
    else if (node instanceof CallExtension) {
        print(`${node.extName}.${node.prop}\n`);
        if (node.args)
            printNodes(node.args, indent + 2);
        if (node.contentArgs)
            node.contentArgs.forEach((n) => { printNodes(n, indent + 2); });
    }
    else {
        let nodes = [];
        let props = null;
        node.iterFields((val, fieldName) => {
            if (val instanceof Node)
                nodes.push([fieldName, val]);
            else {
                props = props || {};
                props[fieldName] = val;
            }
        });
        if (props)
            print(JSON.stringify(props, null, 2) + '\n', null, true);
        else
            print('\n');
        nodes.forEach(([fieldName, n]) => {
            print(`[${fieldName}] =>`, indent + 2);
            printNodes(n, indent + 4);
        });
    }
}
exports.default = {
    Node: Node,
    Root: Root,
    NodeList: NodeList,
    Value: Value,
    Literal: Literal,
    Symbol: Symbol,
    Group: Group,
    Array: Array,
    Pair: Pair,
    Dict: Dict,
    Output: Output,
    Capture: Capture,
    TemplateData: TemplateData,
    If: If,
    IfAsync: IfAsync,
    InlineIf: InlineIf,
    For: For,
    AsyncEach: AsyncEach,
    AsyncAll: AsyncAll,
    Macro: Macro,
    Caller: Caller,
    Import: Import,
    FromImport: FromImport,
    FunCall: FunCall,
    Filter: Filter,
    FilterAsync: FilterAsync,
    KeywordArgs: KeywordArgs,
    Block: Block,
    Super: Super,
    Extends: Extends,
    Include: Include,
    Set: Set,
    Switch: Switch,
    Case: Case,
    LookupVal: LookupVal,
    BinOp: BinOp,
    In: In,
    Is: Is,
    Or: Or,
    And: And,
    Not: Not,
    Add: Add,
    Concat: Concat,
    Sub: Sub,
    Mul: Mul,
    Div: Div,
    FloorDiv: FloorDiv,
    Mod: Mod,
    Pow: Pow,
    Neg: Neg,
    Pos: Pos,
    Compare: Compare,
    CompareOperand: CompareOperand,
    CallExtension: CallExtension,
    CallExtensionAsync: CallExtensionAsync,
    printNodes: printNodes
};
//# sourceMappingURL=nodes.js.map