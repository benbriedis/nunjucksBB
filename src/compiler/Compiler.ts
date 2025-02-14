import parser from '../parser/Parser';
import nodes from '../parser/nodes';
import { transform } from './transformer';
import TemplateError from '../runtime/TemplateError';
import Frame from '../runtime/Frame';

// These are all the same for now, but shouldn't be passed straight
// through
const compareOps = {
	'==': '==',
	'===': '===',
	'!=': '!=',
	'!==': '!==',
	'<': '<',
	'>': '>',
	'<=': '<=',
	'>=': '>='
};

export class Compiler
{
	templateName:string;
	codebuf = [];
	lastId = 0;
	buffer = null;
	bufferStack = [];
	inBlock = false;
	throwOnUndefined:boolean;

	constructor(templateName:string,throwOnUndefined:boolean) 
	{
		this.templateName = templateName;
		this.throwOnUndefined = throwOnUndefined;
	}

	fail(msg:string,lineno:number,colno:number) 
	{
		if (lineno !== undefined) 
			lineno += 1;
		if (colno !== undefined) 
			colno += 1;
		throw new TemplateError(msg,this.templateName,lineno,colno);
	}

	_pushBuffer() 
	{
		const id = this._tmpid();
		this.bufferStack.push(this.buffer);
		this.buffer = id;
		this._emit(`var ${this.buffer} = "";`);
		return id;
	}

	_popBuffer() 
	{
		this.buffer = this.bufferStack.pop();
	}

	_emit(code) 
	{
		this.codebuf.push(code);
	}

	_emitLine(code) 
	{
		this._emit(code + '\n');
	}

	_emitLines(...lines) 
	{
		lines.forEach((line) => this._emitLine(line));
	}

	_emitFuncBegin(node, name) 
	{
		this.buffer = 'output';
		this._emitLine(`async function ${name}(env,context,frame,runtime) {`);
		this._emitLine(`var lineno = ${node.lineno};`);
		this._emitLine(`var colno = ${node.colno};`);
		this._emitLine(`var ${this.buffer} = "";`);
		this._emitLine('try {');
	}

	_emitFuncEnd(noReturn=undefined) 
	{
		if (!noReturn)
			this._emitLine('return ' + this.buffer + ';');

		this._emitLine('} catch (e) {');
		this._emitLine(`  runtime.handleError(e,'`+this._templateName()+`',lineno,colno);`);
		this._emitLine('}');
		this._emitLine('}');
		this.buffer = null;
	}

	_tmpid() 
	{
		this.lastId++;
		return 't_' + this.lastId;
	}

	_templateName() 
	{
		return this.templateName == null ? 'undefined' : JSON.stringify(this.templateName);
	}

	_compileChildren(node, frame) 
	{
		node.children.forEach(child => this.compile(child, frame));
	}

	_compileAggregate(node, frame, startChar=undefined, endChar=undefined) 
	{
		if (startChar)
			this._emit(startChar);

		node.children.forEach((child, i) => {
			if (i > 0) 
				this._emit(',');

			this.compile(child, frame);
		});

		if (endChar) 
			this._emit(endChar);
	}

	_compileExpression(node, frame) 
	{
		// TODO: I'm not really sure if this type check is worth it or
		// not.
		this.assertType(
			node,
			nodes.Literal,
			nodes.Symbol,
			nodes.Group,
			nodes.Array,
			nodes.Dict,
			nodes.FunCall,
			nodes.Caller,
			nodes.Filter,
			nodes.LookupVal,
			nodes.Compare,
			nodes.InlineIf,
			nodes.In,
			nodes.Is,
			nodes.And,
			nodes.Or,
			nodes.Not,
			nodes.Add,
			nodes.Concat,
			nodes.Sub,
			nodes.Mul,
			nodes.Div,
			nodes.FloorDiv,
			nodes.Mod,
			nodes.Pow,
			nodes.Neg,
			nodes.Pos,
			nodes.Compare,
			nodes.NodeList
		);
		this.compile(node, frame);
	}

	assertType(node, ...types) 
	{
		if (!types.some(t => node instanceof t)) 
			this.fail(`assertType: invalid type: ${node.typename()}`,node.lineno,node.colno);
	}

	compileCallExtension(node,frame) 
	{
		var args = node.args;
		var contentArgs = node.contentArgs;
		var autoescape = typeof node.autoescape === 'boolean' ? node.autoescape : true;

		this._emit(`${this.buffer} += runtime.suppressValue(`);

		this._emit(`env.getExtension("${node.extName}")["${node.prop}"](`);
		this._emit('context');

		if (args || contentArgs) 
			this._emit(',');

		if (args) {
			if (!(args instanceof nodes.NodeList)) 
				this.fail('compileCallExtension: arguments must be a NodeList, use `parser.parseSignature`',node.lineno,node.colno);

			args.children.forEach((arg, i) => {
				// Tag arguments are passed normally to the call. Note
				// that keyword arguments are turned into a single js
				// object as the last argument, if they exist.
				this._compileExpression(arg, frame);

				if (i !== args.children.length - 1 || contentArgs.length) {
					this._emit(',');
				}
			});
		}

		if (contentArgs.length) 
			contentArgs.forEach((arg, i) => {
				if (i > 0) 
					this._emit(',');

				if (arg) {
					//var id = this.tmpid();

					this._emit('function() {');
					const id = this._pushBuffer();

					//this.pushBufferId(id);
					//this._popBuffer();
					this.compile(arg, frame);
					//this.popBufferId();
					this._popBuffer();
					this._emitLine(`return ${id};`);
					this._emitLine(`}`);
				} else 
					this._emit('null');
			});

		this._emit(')');
		this._emit(`, ${autoescape} && env.opts.autoescape);\n`);
	}

	compileNodeList(node,frame) 
	{
		this._compileChildren(node, frame);
	}

	compileLiteral(node) 
	{
		if (typeof node.value === 'string') {
			let val = node.value.replace(/\\/g, '\\\\');
			val = val.replace(/"/g, '\\"');
			val = val.replace(/\n/g, '\\n');
			val = val.replace(/\r/g, '\\r');
			val = val.replace(/\t/g, '\\t');
			val = val.replace(/\u2028/g, '\\u2028');
			this._emit(`"${val}"`);
		} else if (node.value === null) 
			this._emit('null');
		else 
			this._emit(node.value.toString());
	}

	compileSymbol(node, frame) 
	{
		var name = node.value;
		var v = frame.lookup(name);

		if (v) {
			this._emit(v);
		} else {
			this._emit('runtime.contextOrFrameLookup(' +
				'context, frame, "' + name + '")');
		}
	}

	compileGroup(node, frame) 
	{
		this._compileAggregate(node, frame, '(', ')');
	}

	compileArray(node, frame) 
	{
		this._compileAggregate(node, frame, '[', ']');
	}

	compileDict(node, frame) 
	{
		this._compileAggregate(node, frame, '{', '}');
	}

	compilePair(node, frame) 
	{
		var key = node.key;
		var val = node.value;

		if (key instanceof nodes.Symbol) 
			key = new nodes.Literal(key.lineno, key.colno, (<any>key).value);
		else if (!(key instanceof nodes.Literal && typeof (<any>key).value === 'string')) 
			this.fail('compilePair: Dict keys must be strings or names',key.lineno,key.colno);

		this.compile(key, frame);
		this._emit(': ');
		this._compileExpression(val, frame);
	}

	compileInlineIf(node, frame) 
	{
		this._emit('(');
		this.compile(node.cond, frame);
		this._emit('?');
		this.compile(node.body, frame);
		this._emit(':');
		if (node.else_ !== null) 
			this.compile(node.else_, frame);
		else 
			this._emit('""');
		this._emit(')');
	}

	compileIn(node, frame) {
		this._emit('runtime.inOperator(');
		this.compile(node.left, frame);
		this._emit(',');
		this.compile(node.right, frame);
		this._emit(')');
	}

	compileIs(node, frame) 
	{
		// first, we need to try to get the name of the test function, if it's a
		// callable (i.e., has args) and not a symbol.
		var right = node.right.name ?
			node.right.name.value
			// otherwise go with the symbol value
			:
			node.right.value;
		this._emit('env.getTest("' + right + '").call(context, ');
		this.compile(node.left, frame);
		// compile the arguments for the callable if they exist
		if (node.right.args) {
			this._emit(',');
			this.compile(node.right.args, frame);
		}
		this._emit(') === true');
	}

	_binOpEmitter(node, frame, str) 
	{
		this.compile(node.left, frame);
		this._emit(str);
		this.compile(node.right, frame);
	}

	// ensure concatenation instead of addition
	// by adding empty string in between
	compileOr(node, frame) { return this._binOpEmitter(node, frame, ' || '); }

	compileAnd(node, frame) { return this._binOpEmitter(node, frame, ' && '); }

	compileAdd(node, frame) { return this._binOpEmitter(node, frame, ' + '); }

	compileConcat(node, frame) { return this._binOpEmitter(node, frame, ' + "" + '); }

	compileSub(node, frame) { return this._binOpEmitter(node, frame, ' - '); }

	compileMul(node, frame) { return this._binOpEmitter(node, frame, ' * '); }

	compileDiv(node, frame) { return this._binOpEmitter(node, frame, ' / '); }

	compileMod(node, frame) { return this._binOpEmitter(node, frame, ' % '); }

	compileNot(node, frame) 
	{
		this._emit('!');
		this.compile(node.target, frame);
	}

	compileFloorDiv(node, frame) 
	{
		this._emit('Math.floor(');
		this.compile(node.left, frame);
		this._emit(' / ');
		this.compile(node.right, frame);
		this._emit(')');
	}

	compilePow(node, frame) 
	{
		this._emit('Math.pow(');
		this.compile(node.left, frame);
		this._emit(', ');
		this.compile(node.right, frame);
		this._emit(')');
	}

	compileNeg(node, frame) 
	{
		this._emit('-');
		this.compile(node.target, frame);
	}

	compilePos(node, frame) 
	{
		this._emit('+');
		this.compile(node.target, frame);
	}

	compileCompare(node, frame) 
	{
		this.compile(node.expr, frame);

		node.ops.forEach((op) => {
			this._emit(` ${compareOps[op.type]} `);
			this.compile(op.expr, frame);
		});
	}

	compileLookupVal(node, frame) 
	{
		this._emit('await runtime.memberLookup((');
		this._compileExpression(node.target, frame);
		this._emit('),');
		this._compileExpression(node.val, frame);
		this._emit(')');
	}

	_getNodeName(node) 
	{
//if (global.go) console.log('_getNodeName()  node:',node);

		if (node instanceof nodes.Symbol)
			return (<any>node).value;
		if (node instanceof nodes.FunCall)
			return 'the return value of (' + this._getNodeName((<any>node).name) + ')';
		if (node instanceof nodes.LookupVal)
			return this._getNodeName((<any>node).target)+'["'+this._getNodeName((<any>node).val)+'"]';
		if (node instanceof nodes.Literal)
			return (<any>node).value.toString();

		return '--expression--';

/*
		switch (node.typename()) {
			case 'Symbol':
				return node.value;
			case 'FunCall':
				return 'the return value of (' + this._getNodeName(node.name) + ')';
			case 'LookupVal':
				return this._getNodeName(node.target) + '["' +
					this._getNodeName(node.val) + '"]';
			case 'Literal':
				return node.value.toString();
			default:
				return '--expression--';
		}
*/		
	}

	compileFunCall(node, frame) 
	{
		// Keep track of line/col info at runtime by settings
		// variables within an expression. An expression in javascript
		// like (x, y, z) returns the last value, and x and y can be
		// anything
		this._emit('(lineno = '+node.lineno+', colno = '+node.colno+', ');

		this._emit('await runtime.callWrap(');
		// Compile it as normal.
//node.name is/can be LookupVal		
		this._compileExpression(node.name,frame);

		// Output the name of what we're calling so we can get friendly errors
		// if the lookup fails.
		this._emit(', "' + this._getNodeName(node.name).replace(/"/g, '\\"') + '",context,');

		this._compileAggregate(node.args,frame,'[', '])');

		this._emit(')');
	}

	compileFilter(node, frame) 
	{
		var name = node.name;
		this.assertType(name, nodes.Symbol);
		this._emit('await env.getFilter("' + name.value + '").call(context,');
		this._compileAggregate(node.args, frame);
		this._emit(')');
	}

	compileKeywordArgs(node, frame) 
	{
		this._emit('runtime.makeKeywordArgs(');
		this.compileDict(node, frame);
		this._emit(')');
	}

	compileSet(node, frame) 
	{
		var ids = [];

		// Lookup the variable names for each identifier and create
		// new ones if necessary
		node.targets.forEach((target) => {
			var name = target.value;
			var id = frame.lookup(name);

			if (id === null || id === undefined) {
				id = this._tmpid();

				// Note: This relies on js allowing scope across
				// blocks, in case this is created inside an `if`
				this._emitLine('var ' + id + ';');
			}

			ids.push(id);
		});

		if (node.value) {
			this._emit(ids.join(' = ') + ' = ');
			this._compileExpression(node.value, frame);
			this._emitLine(';');
		} else {
			this._emit(ids.join(' = ') + ' = ');
			this.compile(node.body, frame);
			this._emitLine(';');
		}

		node.targets.forEach((target, i) => {
			var id = ids[i];
			var name = target.value;

			// We are running this for every var, but it's very
			// uncommon to assign to multiple vars anyway
			this._emitLine(`frame.set("${name}", ${id}, true);`);

			this._emitLine('if(frame.topLevel) {');
			this._emitLine(`context.setVariable("${name}", ${id});`);
			this._emitLine('}');

			if (name.charAt(0) !== '_') {
				this._emitLine('if(frame.topLevel) {');
				this._emitLine(`context.addExport("${name}", ${id});`);
				this._emitLine('}');
			}
		});
	}

	compileSwitch(node, frame) 
	{
		this._emit('switch (');
		this.compile(node.expr, frame);
		this._emit(') {');
		node.cases.forEach((c, i) => {
			this._emit('case ');
			this.compile(c.cond, frame);
			this._emit(': ');
			this.compile(c.body, frame);
			// preserve fall-throughs
			if (c.body.children.length) 
				this._emitLine('break;');
		});
		if (node.default) {
			this._emit('default:');
			this.compile(node.default, frame);
		}
		this._emit('}');
	}

	compileIf(node,frame) 
	{
		this._emit('if(');
		this._compileExpression(node.cond, frame);
		this._emitLine(') {');
		this.compile(node.body, frame);

		if (node.else_) {
			this._emitLine('}\nelse {');
			this.compile(node.else_, frame);
		}
		this._emitLine('}');
	}

	_emitLoopBindings(node, arr, i, len) 
	{
		const bindings = [{
				name: 'index',
				val: `${i} + 1`
			},
			{
				name: 'index0',
				val: i
			},
			{
				name: 'revindex',
				val: `${len} - ${i}`
			},
			{
				name: 'revindex0',
				val: `${len} - ${i} - 1`
			},
			{
				name: 'first',
				val: `${i} === 0`
			},
			{
				name: 'last',
				val: `${i} === ${len} - 1`
			},
			{
				name: 'length',
				val: len
			},
		];

		bindings.forEach((b) => {
			this._emitLine(`frame.set("loop.${b.name}", ${b.val});`);
		});
	}

	compileFor(node, frame) 
	{
		// Some of this code is ugly, but it keeps the generated code
		// as fast as possible. ForAsync also shares some of this, but
		// not much.

		const i = this._tmpid();
		const len = this._tmpid();
		const arr = this._tmpid();
		frame = frame.push();

		this._emitLine('frame = frame.push();');

		this._emit(`var ${arr} = `);
		this._compileExpression(node.arr, frame);
		this._emitLine(';');

		this._emit(`if(${arr}) {`);
		this._emitLine(arr + ' = runtime.fromIterator(' + arr + ');');

		// If multiple names are passed, we need to bind them
		// appropriately
		if (node.name instanceof nodes.Array) {
			this._emitLine(`var ${i};`);

			// The object could be an arroy or object. Note that the
			// body of the loop is duplicated for each condition, but
			// we are optimizing for speed over size.
			this._emitLine(`if(runtime.isArray(${arr})) {`);
			this._emitLine(`var ${len} = ${arr}.length;`);
			this._emitLine(`for(${i}=0; ${i} < ${arr}.length; ${i}++) {`);

			// Bind each declared var
			node.name.children.forEach((child, u) => {
				var tid = this._tmpid();
				this._emitLine(`var ${tid} = ${arr}[${i}][${u}];`);
				this._emitLine(`frame.set("${child}", ${arr}[${i}][${u}]);`);
				frame.set(node.name.children[u].value, tid);
			});

			this._emitLoopBindings(node, arr, i, len);
			this.compile(node.body, frame);
			this._emitLine('}');

			this._emitLine('} else {');
			// Iterate over the key/values of an object
			const [key, val] = node.name.children;
			const k = this._tmpid();
			const v = this._tmpid();
			frame.set(key.value, k);
			frame.set(val.value, v);

			this._emitLine(`${i} = -1;`);
			this._emitLine(`var ${len} = runtime.keys(${arr}).length;`);
			this._emitLine(`for(var ${k} in ${arr}) {`);
			this._emitLine(`${i}++;`);
			this._emitLine(`var ${v} = ${arr}[${k}];`);
			this._emitLine(`frame.set("${key.value}", ${k});`);
			this._emitLine(`frame.set("${val.value}", ${v});`);

			this._emitLoopBindings(node, arr, i, len);
			this.compile(node.body, frame);
			this._emitLine('}');

			this._emitLine('}');
		} else {
			// Generate a typical array iteration
			const v = this._tmpid();
			frame.set(node.name.value, v);

			this._emitLine(`var ${len} = ${arr}.length;`);
			this._emitLine(`for(var ${i}=0; ${i} < ${arr}.length; ${i}++) {`);
			this._emitLine(`var ${v} = ${arr}[${i}];`);
			this._emitLine(`frame.set("${node.name.value}", ${v});`);

			this._emitLoopBindings(node, arr, i, len);

			this.compile(node.body, frame);

			this._emitLine('}');
		}

		this._emitLine('}');
		if (node.else_) {
			this._emitLine('if (!' + len + ') {');
			this.compile(node.else_, frame);
			this._emitLine('}');
		}

		this._emitLine('frame = frame.pop();');
	}

	_compileMacro(node, frame:Frame|null) 
	{
		var args = [];
		var kwargs = null;
		var funcId = 'macro_' + this._tmpid();
		var keepFrame = (frame != null);

		// Type check the definition of the args
		node.args.children.forEach((arg, i) => {
			if (i === node.args.children.length - 1 && arg instanceof nodes.Dict) 
				kwargs = arg;
			else {
				this.assertType(arg, nodes.Symbol);
				args.push(arg);
			}
		});

		const realNames = [...args.map((n) => `l_${n.value}`), 'kwargs'];

		// Quoted argument names
		const argNames = args.map((n) => `"${n.value}"`);
		const kwargNames = ((kwargs && kwargs.children) || []).map((n) => `"${n.key.value}"`);

		// We pass a function to makeMacro which destructures the
		// arguments so support setting positional args with keywords
		// args and passing keyword args as positional args
		// (essentially default values). See runtime.js.

		const currFrame = keepFrame ? frame.push(true) : new Frame();

		this._emitLines(
			`var ${funcId} = runtime.makeMacro(`,
			`[${argNames.join(', ')}], `,
			`[${kwargNames.join(', ')}], `,
			`async function (${realNames.join(', ')}) {`,
			'var callerFrame = frame;',
			'frame = ' + (keepFrame ? 'frame.push(true);' : 'new runtime.Frame();'),
			'kwargs = kwargs || {};',
			'if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {',
			'frame.set("caller", kwargs.caller); }');

		// Expose the arguments to the template. Don't need to use
		// random names because the function
		// will create a new run-time scope for us
		args.forEach(arg => {
			this._emitLine(`frame.set("${arg.value}", l_${arg.value});`);
			currFrame.set(arg.value, `l_${arg.value}`);
		});

		// Expose the keyword arguments
		if (kwargs) {
			kwargs.children.forEach(pair => {
				const name = pair.key.value;
				this._emit(`frame.set("${name}", `);
				this._emit(`Object.prototype.hasOwnProperty.call(kwargs, "${name}")`);
				this._emit(` ? kwargs["${name}"] : `);
				this._compileExpression(pair.value, currFrame);
				this._emit(');');
			});
		}

		const bufferId = this._pushBuffer();

		this.compile(node.body, currFrame);

		this._emitLine('frame = ' + (keepFrame ? 'frame.pop();' : 'callerFrame;'));
		this._emitLine(`return new runtime.SafeString(${bufferId});`);
		this._emitLine('});');
		this._popBuffer();

		return funcId;
	}

	compileMacro(node, frame) 
	{
		var funcId = this._compileMacro(node,null);

		// Expose the macro to the templates
		var name = node.name.value;
		frame.set(name, funcId);

		if (frame.parent) 
			this._emitLine(`frame.set("${name}", ${funcId});`);
		else {
			if (node.name.value.charAt(0) !== '_') 
				this._emitLine(`context.addExport("${name}");`);
			this._emitLine(`context.setVariable("${name}", ${funcId});`);
		}
	}

	compileCaller(node, frame) 
	{
		// basically an anonymous "macro expression"
		this._emit('(function (){');
		const funcId = this._compileMacro(node, frame);
		this._emit(`return ${funcId};})()`);
	}

	//XXX QQQ BB: what does parentName do? Not present in 2013
	_compileGetTemplate(node, frame, eagerCompile, ignoreMissing) 
	{
		//    const parentTemplateId = this._tmpid();
		const parentName = this._templateName();
		const eagerCompileArg = eagerCompile ? 'true' : 'false';
		const ignoreMissingArg = ignoreMissing ? 'true' : 'false';
		this._emit('await env.getTemplate(');
		this._compileExpression(node.template, frame);
		this._emitLine(`, ${eagerCompileArg}, ${parentName}, ${ignoreMissingArg})`);
		//    return parentTemplateId;
	}

	compileImport(node, frame) 
	{
		const target = node.target.value;
		const id = this._tmpid();

		this._emit(`const ${id} = await (`);
		this._compileGetTemplate(node, frame, false, false);
		this._emit(`).getExported(` +
//      		(node.withContext ? `context.getVariables(),frame,${id}` : '') +
      		(node.withContext ? `context.getVariables(),frame` : '') +
		');');

		frame.set(target, id);

		if (frame.parent) 
			this._emitLine(`frame.set("${target}", ${id});`);
		else 
			this._emitLine(`context.setVariable("${target}", ${id});`);
	}

	compileFromImport(node, frame) 
	{
		const importedId = this._tmpid();
		this._emit(`const ${importedId} = await (`);
		this._compileGetTemplate(node, frame, false, false);
		this._emit(`).getExported(`+
//      		(node.withContext ? `context.getVariables(),frame,${importedId}` : '') +
      		(node.withContext ? `context.getVariables(),frame` : '') +
		');');

		node.names.children.forEach(nameNode => {
			var name;
			var alias;
			var id = this._tmpid();

			if (nameNode instanceof nodes.Pair) {
				name = (<any>nameNode).key.value;
				alias = (<any>nameNode).value.value;
			} else {
				name = nameNode.value;
				alias = name;
			}

			this._emitLine(`if(Object.prototype.hasOwnProperty.call(${importedId}, "${name}")) {`);
			this._emitLine(`var ${id} = ${importedId}.${name};`);
			this._emitLine('} else {');
			this._emitLine(`throw new Error("cannot import ${name}")`);
			this._emitLine('}');

			frame.set(alias, id);

			if (frame.parent) 
				this._emitLine(`frame.set("${alias}", ${id});`);
			else 
				this._emitLine(`context.setVariable("${alias}", ${id});`);
		});
	}

	compileBlock(node) 
	{
		var id = this._tmpid();

		// If we are executing outside a block (creating a top-level
		// block), we really don't want to execute its code because it
		// will execute twice: once when the child template runs and
		// again when the parent template runs. Note that blocks
		// within blocks will *always* execute immediately *and*
		// wherever else they are invoked (like used in a parent
		// template). This may have behavioral differences from jinja
		// because blocks can have side effects, but it seems like a
		// waste of performance to always execute huge top-level
		// blocks twice


		if (this.inBlock) 
			this._emit(`${this.buffer} += await context.getBlock("${node.name.value}")(env,context,frame,runtime);`);
		else {
			this._emitLine('if (!parentTemplate)');
			this._emitLine(`${this.buffer} += await context.getBlock("${node.name.value}")(env,context,frame,runtime);`);
		}
	}

	compileSuper(node, frame) 
	{
		var name = node.blockName.value;
		var id = node.symbol.value;
		this._emitLine(`var ${id} = runtime.markSafe(await context.getSuper(env,"${name}",b_${name},frame,runtime));`);
		frame.set(id, id);
	}

	compileExtends(node,frame) 
	{
		var k = this._tmpid();

		// extends is a dynamic tag and can occur within a block like
		// `if`, so if this happens we need to capture the parent
		// template in the top-level scope
		this._emit(`parentTemplate = `);
		this._compileGetTemplate(node, frame, true, false);
		this._emit(`;`);

		this._emitLine(`for(var ${k} in parentTemplate.blocks) {`);
		this._emitLine(`context.addBlock(${k}, parentTemplate.blocks[${k}]);`);
		this._emitLine('}');
	}

	//XXX QQQ BB: why do we want eagerCompile?  
	//XXX QQQ BB: remove waterfall

	compileInclude(node, frame) 
	{
		//XXX QQQ BB: why does this have a var and most of the others not?
		const templateId = this._tmpid();
		this._emit(`var ${templateId} = `);
		this._compileGetTemplate(node, frame, true, node.ignoreMissing);
		this._emit(`;`);
		this._emitLine(this.buffer+` += await ${templateId}.render(context.getVariables(),frame.push());`);
	}

	compileTemplateData(node,frame) 
	{
		this.compileLiteral(node);
	}

	compileCapture(node, frame) 
	{
		// we need to temporarily override the current buffer id as 'output'
		// so the set block writes to the capture output instead of the buffer
		var buffer = this.buffer;
		this.buffer = 'output';
		this._emitLine('await (async function() {');
		this._emitLine('var output = "";');
		this.compile(node.body, frame);
		this._emitLine('return output;');
		this._emitLine('})()');
		// and of course, revert back to the old buffer id
		this.buffer = buffer;
	}

	compileOutput(node, frame) 
	{
		const children = node.children;
		children.forEach(child => {
			// TemplateData is a special case because it is never
			// autoescaped, so simply output it for optimization
			if (child instanceof nodes.TemplateData) {
				if ((<any>child).value) {
					this._emit(`${this.buffer} += `);
					this.compileLiteral(child);
					this._emitLine(';');
				}
			} else {
				this._emit(`${this.buffer} += runtime.suppressValue(`);
				if (this.throwOnUndefined) 
					this._emit('runtime.ensureDefined(');
				this.compile(child, frame);
				if (this.throwOnUndefined) 
					this._emit(`,${node.lineno},${node.colno})`);
				this._emit(', env.opts.autoescape);\n');
			}
		});
	}

	compileRoot(node, frame) 
	{
		if (frame) 
			this.fail('compileRoot: root node can\'t have frame',node.lineno,node.colno);

		frame = new Frame();

		this._emitFuncBegin(node, 'root');
		this._emitLine('var parentTemplate = null;');
		this._compileChildren(node, frame);

		this._emitLine('if(parentTemplate)');
		this._emitLine('return await parentTemplate.rootRenderFunc(env, context, frame, runtime);');
		this._emitLine('else');
		this._emitLine(`return ${this.buffer};`);
		this._emitFuncEnd(true);

		this.inBlock = true;

		const blockNames = [];

		const blocks = node.findAll(nodes.Block);

		blocks.forEach((block, i) => {
			const name = block.name.value;

			if (blockNames.indexOf(name) !== -1) 
				this.fail(`Block "${name}" defined more than once.`,node.lineno, node.colno);
			blockNames.push(name);

			this._emitFuncBegin(block, `b_${name}`);

			const tmpFrame = new Frame();
//			this._emitLine('var frame = frame.push(true);');
			this._emitLine('frame = frame.push(true);');
			this.compile(block.body, tmpFrame);
			this._emitFuncEnd();
		});

		this._emitLine('return {');

		blocks.forEach((block, i) => {
			const blockName = `b_${block.name.value}`;
			this._emitLine(`${blockName}: ${blockName},`);
		});

		this._emitLine('root: root\n};');
	}

	compile(node,frame=undefined) 
	{
		var _compile = this['compile' + node.typename()];
		if (_compile) 
			_compile.call(this, node, frame);
		else {
			console.log('ERROR compiler.js compile()  node:', node);
			this.fail(`compile: Cannot compile node: ${node.typename()}`,node.lineno, node.colno);
		}
	}

	getCode() 
	{
		return this.codebuf.join('');
	}
}

function compile(src, extensions, name, opts:any = {}) 
{
	const c = new Compiler(name, opts.throwOnUndefined);

	// Run the extension preprocessors against the source.
	const preprocessors = (extensions || []).map(ext => ext.preprocess).filter(f => !!f);

	const processedSrc = preprocessors.reduce((s, processor) => processor(s), src);

//XXX it would be nice to know what transform is meant to do
	c.compile(transform(parser.parse(processedSrc, extensions, opts)));
//	c.compile(parser.parse(processedSrc, extensions, opts));

	return c.getCode();
};


export default {
	compile: compile,
	Compiler: Compiler
};

