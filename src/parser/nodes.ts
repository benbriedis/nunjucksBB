
export abstract class Node 
{
	lineno:number;
	colno:number;
	get fields() { return []; }  //XXX I'd rather fields were not dynamically added

	constructor(lineno:number, colno:number, ...args) 
	{
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

	abstract typename():string;

	findAll(type, results) 
	{
		results = results || [];

		if (this instanceof NodeList) 
			//XXX 'children' is added as a dynamic field by NodeList
			(<any>this).children.forEach(child => traverseAndCheck(child, type, results));
		else 
			this.fields.forEach(field => traverseAndCheck(this[field], type, results));

		return results;
	}

	iterFields(func) 
	{
		this.fields.forEach((field) => {
			func(this[field], field);
		});
	}
}

// Abstract nodes
export class Value extends Node 
{
	typename() { return 'Value'; }
	get fields() { return ['value']; }
}

// Concrete nodes
export class NodeList extends Node 
{
	typename() { return 'NodeList'; }
	get fields() { return ['children']; }

	constructor(lineno=undefined, colno=undefined, nodes=undefined) 
	{
		super(lineno, colno, nodes || []);
	}

	addChild(node) 
	{
		(<any>this).children.push(node);
	}

	//XXX will be overridden using a dynamic field
	children():any {}
}

class Root extends NodeList {typename() {return 'Root';}};
class Literal extends Value {typename() {return 'Literal';} };

class Symbol extends Value {typename() {return 'Symbol';} };
class Group extends NodeList {typename() {return 'Group';} };
class ArrayNode extends NodeList {typename() {return 'Array';} };     		//FIXME? may get in trouble for using this name...
class Pair extends Node {typename() {return 'Pair';}  get fields() { return ['key', 'value']; } };
class Dict extends NodeList {typename() {return 'Dict';} };
class LookupVal extends Node {typename() {return 'LookupVal';}  get fields() { return ['target', 'val']; } };
class If extends Node {typename() {return 'If';}  get fields() { return ['cond', 'body', 'else_']; } };
class InlineIf extends Node {typename() {return 'InlineIf';}  get fields() { return ['cond', 'body', 'else_']; } };
class For extends Node {typename() {return 'For';}  get fields() { return ['arr', 'name', 'body', 'else_']; } };
class Macro extends Node {typename() {return 'Macro';}  get fields() { return ['name', 'args', 'body']; } };
class Caller extends Macro {typename() {return 'Caller';} };
class Import extends Node {typename() {return 'Import';}  get fields() { return ['template', 'target', 'withContext']; } };

class FromImport extends Node 
{
	typename() { return 'FromImport'; }
	get fields() { return ['template', 'names', 'withContext']; }

	constructor(lineno, colno, template, names, withContext) {
		super(lineno, colno, template, names || new NodeList(), withContext);
	}
}

class FunCall extends Node {typename() {return 'FunCall';}  get fields() { return ['name', 'args']; } };
class Filter extends FunCall {typename() {return 'Filter';} };
class FilterAsync extends Filter {typename() {return 'FilterAsync';}  get fields() { return ['name', 'args', 'symbol']; } };
class KeywordArgs extends Dict {typename() {return 'KeywordArgs';} };
class Block extends Node {typename() {return 'Block';}  get fields() { return ['name', 'body']; } };
class Super extends Node {typename() {return 'Super';}  get fields() { return ['blockName', 'symbol']; } };
class TemplateRef extends Node {typename() {return 'TemplateRef';}  get fields() { return ['template']; } };
class Extends extends TemplateRef {typename() {return 'Extends';} };
class Include extends Node {typename() {return 'Include';}  get fields() { return ['template', 'ignoreMissing']; } };
class Set extends Node {typename() {return 'Set';}  get fields() { return ['targets', 'value']; } };
class Switch extends Node {typename() {return 'Switch';}  get fields() { return ['expr', 'cases', 'default']; } };
class Case extends Node {typename() {return 'Case';}  get fields() { return ['cond', 'body']; } };
class Output extends NodeList {typename() {return 'Output';} };
class Capture extends Node {typename() {return 'Capture';}  get fields() { return ['body']; } };
class TemplateData extends Literal {typename() {return 'TemplateData';} };
class UnaryOp extends Node {typename() {return 'UnaryOp';}  get fields() { return ['target']; } };
class BinOp extends Node {typename() {return 'BinOp';}  get fields() { return ['left', 'right']; } };
class In extends BinOp {typename() {return 'In';} };
class Is extends BinOp {typename() {return 'Is';} };
class Or extends BinOp {typename() {return 'Or';} };
class And extends BinOp {typename() {return 'And';} };
class Not extends UnaryOp {typename() {return 'Not';} };
class Add extends BinOp {typename() {return 'Add';} };
class Concat extends BinOp {typename() {return 'Concat';} };
class Sub extends BinOp {typename() {return 'Sub';} };
class Mul extends BinOp {typename() {return 'Mul';} };
class Div extends BinOp {typename() {return 'Div';} };
class FloorDiv extends BinOp {typename() {return 'FloorDiv';} };
class Mod extends BinOp {typename() {return 'Mod';} };
class Pow extends BinOp {typename() {return 'Pow';} };
class Neg extends UnaryOp {typename() {return 'Neg';} };
class Pos extends UnaryOp {typename() {return 'Pos';} };
class Compare extends Node {typename() {return 'Compare';}  get fields() { return ['expr', 'ops']; } };
class CompareOperand extends Node {typename() {return 'CompareOperand';}  get fields() { return ['expr', 'type']; } };

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
class CallExtension extends Node
{
	extName;
	prop;
	args;
	contentArgs;
	autoescape;

	constructor(lineno,colno,ext, prop, args, contentArgs) 
	{
	//constructor(lineno, colno, ...args) 
		super(lineno,colno,ext, prop, args, contentArgs) 
//		this.parent();
		this.extName = ext.__name || ext;
		this.prop = prop;
		this.args = args || new NodeList();
		this.contentArgs = contentArgs || [];
		this.autoescape = ext.autoescape;
	}

	get fields() { return ['extName', 'prop', 'args', 'contentArgs']; }
	typename() {return 'CallExtension';} 
}



// This is hacky, but this is just a debugging function anyway
function print(str, indent=undefined, inline=undefined) {
	var lines = str.split('\n');

	lines.forEach((line, i) => {
		if (line && ((inline && i > 0) || !inline)) 
			process.stdout.write((' ').repeat(indent));

		const nl = (i === lines.length - 1) ? '' : '\n';
			process.stdout.write(`${line}${nl}`);
	});
}

// Print the AST in a nicely formatted tree format for debuggin
function printNodes(node, indent) 
{
	indent = indent || 0;

	print(node.typename() + ': ', indent);

	if (node instanceof NodeList) {
		print('\n');
		(<any>node).children.forEach((n) => {
			printNodes(n, indent + 2);
		});
	} else if (node instanceof CallExtension) {
		print(`${node.extName}.${node.prop}\n`);

		if (node.args) 
			printNodes(node.args, indent + 2);

		if (node.contentArgs) 
			node.contentArgs.forEach((n) => { printNodes(n, indent + 2); });
	} else {
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

function traverseAndCheck(obj, type, results) 
{
	if (obj instanceof type) 
		results.push(obj);

	if (obj instanceof Node) 
		obj.findAll(type, results);
}


export default {
	Node: Node,
	Root: Root,
	NodeList: NodeList,
	Value: Value,
	Literal: Literal,
	Symbol: Symbol,
	Group: Group,
	Array: ArrayNode,
	Pair: Pair,
	Dict: Dict,
	Output: Output,
	Capture: Capture,
	TemplateData: TemplateData,
	If: If,
	InlineIf: InlineIf,
	For: For,
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

	printNodes: printNodes
};

