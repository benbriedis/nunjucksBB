import nodes from './nodes';

var sym = 0;

function gensym() 
{
	return 'hole_' + sym++;
}

// copy-on-write version of map
function mapCOW(arr, func) 
{
	var res = null;
	for (let i = 0; i < arr.length; i++) {
		const item = func(arr[i]);

		if (item !== arr[i]) {
			if (!res) 
				res = arr.slice();
			res[i] = item;
		}
	}

	return res || arr;
}

function walk(ast, func, depthFirst=undefined) 
{
	if (!(ast instanceof nodes.Node)) 
		return ast;

	if (!depthFirst) {
		const astT = func(ast);
		if (astT && astT !== ast) 
			return astT;
	}

	if (ast instanceof nodes.NodeList) {
		const children = mapCOW(ast.children, (node) => walk(node, func, depthFirst));  //TODO tighten up the typing of nodes
//		const children = mapCOW(ast['children'], (node) => walk(node, func, depthFirst));

		if (children !== ast.children) 
			ast = new nodes[ast.typename](ast.lineno, ast.colno, children);

	} else if (ast instanceof nodes.CallExtension) {
		const args = walk(ast.args, func, depthFirst);
		const contentArgs = mapCOW(ast.contentArgs, (node) => walk(node, func, depthFirst));

		if (args !== ast.args || contentArgs !== ast.contentArgs) 
			ast = new nodes[ast.typename](ast.extName, ast.prop, args, contentArgs);
	} 
	else {
		const props = ast.fields.map((field) => ast[field]);
		const propsT = mapCOW(props, (prop) => walk(prop, func, depthFirst));

		if (propsT !== props) {
			ast = new nodes[ast.typename](ast.lineno, ast.colno);
			propsT.forEach((prop, i) => {
				ast[ast.fields[i]] = prop;
			});
		}
	}
	return depthFirst ? (func(ast) || ast) : ast;
}

function depthWalk(ast, func) 
{
	return walk(ast, func, true);
}

function _liftFilters(node, prop=undefined) 
{
	var children = [];

	var walked = depthWalk(prop ? node[prop] : node, descNode => {
		let symbol;
		if (descNode instanceof nodes.Block) 
			return descNode;
		return symbol;
	});

	if (prop) 
		node[prop] = walked;
	else 
		node = walked;

	if (children.length) {
		children.push(node);

		return new nodes.NodeList(
			node.lineno,
			node.colno,
			children
		);
	} else 
		return node;
}

function liftFilters(ast) 
{
	return depthWalk(ast, (node) => {
		if (node instanceof nodes.Output) 
			return _liftFilters(node);
		else if (node instanceof nodes.Set) 
			return _liftFilters(node,'value');
		else if (node instanceof nodes.For) 
			return _liftFilters(node,'arr');
		else if (node instanceof nodes.If) 
			return _liftFilters(node,'cond');
		else if (node instanceof nodes.CallExtension) 
			return _liftFilters(node,'args');
		else 
			return undefined;
	});
}

function liftSuper(ast) 
{
	return walk(ast, (blockNode) => {
		if (!(blockNode instanceof nodes.Block)) 
			return;

		let hasSuper = false;
		const symbol = gensym();

//		blockNode.body = walk(blockNode.body, (node) => { // eslint-disable-line consistent-return
		blockNode['body'] = walk(blockNode['body'], (node) => { // eslint-disable-line consistent-return
//			if (node instanceof nodes.FunCall && node.name.value === 'super') {    	//TODO tighten types
			if (node instanceof nodes.FunCall && node['name'].value === 'super') {
				hasSuper = true;
				return new nodes.Symbol(node.lineno, node.colno, symbol);
			}
		});

		if (hasSuper) 
//			blockNode.body.children.unshift(new nodes.Super(
			blockNode['body'].children.unshift(new nodes.Super(
//				0, 0, blockNode.name, new nodes.Symbol(0, 0, symbol)
				0, 0, blockNode['name'], new nodes.Symbol(0, 0, symbol)
			));
	});
}

function convertStatements(ast) 
{
	return depthWalk(ast, (node) => {
		if (!(node instanceof nodes.If) && !(node instanceof nodes.For)) 
			return undefined;

		walk(node, (child) => {
			if (child instanceof nodes.FilterAsync ||
				child instanceof nodes.CallExtensionAsync) {
				// Stop iterating by returning the node
				return child;
			}
			return undefined;
		});
		return undefined;
	});
}

function cps(ast) 
{
	return convertStatements(liftSuper(liftFilters(ast)));
}

export function transform(ast) 
{
	return cps(ast);
}

// var parser = require('./parser');
// var src = 'hello {% foo %}{% endfoo %} end';
// var ast = transform(parser.parse(src, [new FooExtension()]), ['bar']);
// nodes.printNodes(ast);

