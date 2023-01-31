'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mod = exports.FloorDiv = exports.Div = exports.Mul = exports.Sub = exports.Concat = exports.Add = exports.Not = exports.And = exports.Or = exports.Is = exports.In = exports.BinOp = exports.UnaryOp = exports.TemplateData = exports.Capture = exports.Output = exports.Case = exports.Switch = exports.Set = exports.Include = exports.Extends = exports.TemplateRef = exports.Super = exports.Block = exports.KeywordArgs = exports.FilterAsync = exports.Filter = exports.FunCall = exports.FromImport = exports.Import = exports.Caller = exports.Macro = exports.AsyncAll = exports.AsyncEach = exports.For = exports.InlineIf = exports.IfAsync = exports.If = exports.LookupVal = exports.Dict = exports.Pair = exports.ArrayNode = exports.Group = exports.Symbol = exports.Literal = exports.Root = exports.NodeList = exports.Value = exports.Node = void 0;
exports.printNodes = exports.print = exports.CallExtensionAsync = exports.CallExtension = exports.CompareOperand = exports.Compare = exports.Pos = exports.Neg = exports.Pow = void 0;
const object_1 = require("./object");
function traverseAndCheck(obj, type, results) {
    if (obj instanceof type)
        results.push(obj);
    if (obj instanceof Node)
        obj.findAll(type, results);
}
class Node extends object_1.Obj {
    init(lineno, colno, ...args) {
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
    get fields() {
        return ['value'];
    }
}
exports.Value = Value;
// Concrete nodes
class NodeList extends Node {
    get typename() { return 'NodeList'; }
    get fields() { return ['children']; }
    init(lineno, colno, nodes) {
        super.init(lineno, colno, nodes || []);
    }
    addChild(node) {
        this.children.push(node);
    }
}
exports.NodeList = NodeList;
exports.Root = NodeList.extend('Root');
exports.Literal = Value.extend('Literal');
exports.Symbol = Value.extend('Symbol');
exports.Group = NodeList.extend('Group');
exports.ArrayNode = NodeList.extend('Array');
exports.Pair = Node.extend('Pair', { fields: ['key', 'value'] });
exports.Dict = NodeList.extend('Dict');
exports.LookupVal = Node.extend('LookupVal', { fields: ['target', 'val'] });
exports.If = Node.extend('If', { fields: ['cond', 'body', 'else_'] });
exports.IfAsync = exports.If.extend('IfAsync');
exports.InlineIf = Node.extend('InlineIf', { fields: ['cond', 'body', 'else_'] });
exports.For = Node.extend('For', { fields: ['arr', 'name', 'body', 'else_'] });
exports.AsyncEach = exports.For.extend('AsyncEach');
exports.AsyncAll = exports.For.extend('AsyncAll');
exports.Macro = Node.extend('Macro', { fields: ['name', 'args', 'body'] });
exports.Caller = exports.Macro.extend('Caller');
exports.Import = Node.extend('Import', { fields: ['template', 'target', 'withContext'] });
class FromImport extends Node {
    get typename() { return 'FromImport'; }
    get fields() { return ['template', 'names', 'withContext']; }
    init(lineno, colno, template, names, withContext) {
        super.init(lineno, colno, template, names || new NodeList(), withContext);
    }
}
exports.FromImport = FromImport;
exports.FunCall = Node.extend('FunCall', { fields: ['name', 'args'] });
exports.Filter = exports.FunCall.extend('Filter');
exports.FilterAsync = exports.Filter.extend('FilterAsync', { fields: ['name', 'args', 'symbol'] });
exports.KeywordArgs = exports.Dict.extend('KeywordArgs');
exports.Block = Node.extend('Block', { fields: ['name', 'body'] });
exports.Super = Node.extend('Super', { fields: ['blockName', 'symbol'] });
exports.TemplateRef = Node.extend('TemplateRef', { fields: ['template'] });
exports.Extends = exports.TemplateRef.extend('Extends');
exports.Include = Node.extend('Include', { fields: ['template', 'ignoreMissing'] });
exports.Set = Node.extend('Set', { fields: ['targets', 'value'] });
exports.Switch = Node.extend('Switch', { fields: ['expr', 'cases', 'default'] });
exports.Case = Node.extend('Case', { fields: ['cond', 'body'] });
exports.Output = NodeList.extend('Output');
exports.Capture = Node.extend('Capture', { fields: ['body'] });
exports.TemplateData = exports.Literal.extend('TemplateData');
exports.UnaryOp = Node.extend('UnaryOp', { fields: ['target'] });
exports.BinOp = Node.extend('BinOp', { fields: ['left', 'right'] });
exports.In = exports.BinOp.extend('In');
exports.Is = exports.BinOp.extend('Is');
exports.Or = exports.BinOp.extend('Or');
exports.And = exports.BinOp.extend('And');
exports.Not = exports.UnaryOp.extend('Not');
exports.Add = exports.BinOp.extend('Add');
exports.Concat = exports.BinOp.extend('Concat');
exports.Sub = exports.BinOp.extend('Sub');
exports.Mul = exports.BinOp.extend('Mul');
exports.Div = exports.BinOp.extend('Div');
exports.FloorDiv = exports.BinOp.extend('FloorDiv');
exports.Mod = exports.BinOp.extend('Mod');
exports.Pow = exports.BinOp.extend('Pow');
exports.Neg = exports.UnaryOp.extend('Neg');
exports.Pos = exports.UnaryOp.extend('Pos');
exports.Compare = Node.extend('Compare', { fields: ['expr', 'ops'] });
exports.CompareOperand = Node.extend('CompareOperand', { fields: ['expr', 'type'] });
exports.CallExtension = Node.extend('CallExtension', {
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
exports.CallExtensionAsync = exports.CallExtension.extend('CallExtensionAsync');
// This is hacky, but this is just a debugging function anyway
function print(str, indent, inline) {
    var lines = str.split('\n');
    lines.forEach((line, i) => {
        if (line && ((inline && i > 0) || !inline))
            process.stdout.write((' ').repeat(indent));
        const nl = (i === lines.length - 1) ? '' : '\n';
        process.stdout.write(`${line}${nl}`);
    });
}
exports.print = print;
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
    else if (node instanceof exports.CallExtension) {
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
exports.printNodes = printNodes;
exports.default = {
    Node: Node,
    Root: exports.Root,
    NodeList: NodeList,
    Value: Value,
    Literal: exports.Literal,
    Symbol: exports.Symbol,
    Group: exports.Group,
    Array: exports.ArrayNode,
    Pair: exports.Pair,
    Dict: exports.Dict,
    Output: exports.Output,
    Capture: exports.Capture,
    TemplateData: exports.TemplateData,
    If: exports.If,
    IfAsync: exports.IfAsync,
    InlineIf: exports.InlineIf,
    For: exports.For,
    AsyncEach: exports.AsyncEach,
    AsyncAll: exports.AsyncAll,
    Macro: exports.Macro,
    Caller: exports.Caller,
    Import: exports.Import,
    FromImport: FromImport,
    FunCall: exports.FunCall,
    Filter: exports.Filter,
    FilterAsync: exports.FilterAsync,
    KeywordArgs: exports.KeywordArgs,
    Block: exports.Block,
    Super: exports.Super,
    Extends: exports.Extends,
    Include: exports.Include,
    Set: exports.Set,
    Switch: exports.Switch,
    Case: exports.Case,
    LookupVal: exports.LookupVal,
    BinOp: exports.BinOp,
    In: exports.In,
    Is: exports.Is,
    Or: exports.Or,
    And: exports.And,
    Not: exports.Not,
    Add: exports.Add,
    Concat: exports.Concat,
    Sub: exports.Sub,
    Mul: exports.Mul,
    Div: exports.Div,
    FloorDiv: exports.FloorDiv,
    Mod: exports.Mod,
    Pow: exports.Pow,
    Neg: exports.Neg,
    Pos: exports.Pos,
    Compare: exports.Compare,
    CompareOperand: exports.CompareOperand,
    CallExtension: exports.CallExtension,
    CallExtensionAsync: exports.CallExtensionAsync,
    printNodes: printNodes
};
//# sourceMappingURL=nodes.js.map