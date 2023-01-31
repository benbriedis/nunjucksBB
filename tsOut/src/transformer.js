'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodes_1 = __importDefault(require("./nodes"));
const lib_1 = __importDefault(require("./lib"));
var sym = 0;
function gensym() {
    return 'hole_' + sym++;
}
// copy-on-write version of map
function mapCOW(arr, func) {
    var res = null;
    for (let i = 0; i < arr.length; i++) {
        const item = func(arr[i]);
        if (item !== arr[i]) {
            if (!res) {
                res = arr.slice();
            }
            res[i] = item;
        }
    }
    return res || arr;
}
function walk(ast, func, depthFirst) {
    if (!(ast instanceof nodes_1.default.Node)) {
        return ast;
    }
    if (!depthFirst) {
        const astT = func(ast);
        if (astT && astT !== ast) {
            return astT;
        }
    }
    if (ast instanceof nodes_1.default.NodeList) {
        const children = mapCOW(ast.children, (node) => walk(node, func, depthFirst));
        if (children !== ast.children) {
            ast = new nodes_1.default[ast.typename](ast.lineno, ast.colno, children);
        }
    }
    else if (ast instanceof nodes_1.default.CallExtension) {
        const args = walk(ast.args, func, depthFirst);
        const contentArgs = mapCOW(ast.contentArgs, (node) => walk(node, func, depthFirst));
        if (args !== ast.args || contentArgs !== ast.contentArgs) {
            ast = new nodes_1.default[ast.typename](ast.extName, ast.prop, args, contentArgs);
        }
    }
    else {
        const props = ast.fields.map((field) => ast[field]);
        const propsT = mapCOW(props, (prop) => walk(prop, func, depthFirst));
        if (propsT !== props) {
            ast = new nodes_1.default[ast.typename](ast.lineno, ast.colno);
            propsT.forEach((prop, i) => {
                ast[ast.fields[i]] = prop;
            });
        }
    }
    return depthFirst ? (func(ast) || ast) : ast;
}
function depthWalk(ast, func) {
    return walk(ast, func, true);
}
function _liftFilters(node, asyncFilters, prop) {
    var children = [];
    var walked = depthWalk(prop ? node[prop] : node, (descNode) => {
        let symbol;
        if (descNode instanceof nodes_1.default.Block) {
            return descNode;
        }
        else if ((descNode instanceof nodes_1.default.Filter &&
            lib_1.default.indexOf(asyncFilters, descNode.name.value) !== -1) ||
            descNode instanceof nodes_1.default.CallExtensionAsync) {
            symbol = new nodes_1.default.Symbol(descNode.lineno, descNode.colno, gensym());
            children.push(new nodes_1.default.FilterAsync(descNode.lineno, descNode.colno, descNode.name, descNode.args, symbol));
        }
        return symbol;
    });
    if (prop) {
        node[prop] = walked;
    }
    else {
        node = walked;
    }
    if (children.length) {
        children.push(node);
        return new nodes_1.default.NodeList(node.lineno, node.colno, children);
    }
    else {
        return node;
    }
}
function liftFilters(ast, asyncFilters) {
    return depthWalk(ast, (node) => {
        if (node instanceof nodes_1.default.Output) {
            return _liftFilters(node, asyncFilters);
        }
        else if (node instanceof nodes_1.default.Set) {
            return _liftFilters(node, asyncFilters, 'value');
        }
        else if (node instanceof nodes_1.default.For) {
            return _liftFilters(node, asyncFilters, 'arr');
        }
        else if (node instanceof nodes_1.default.If) {
            return _liftFilters(node, asyncFilters, 'cond');
        }
        else if (node instanceof nodes_1.default.CallExtension) {
            return _liftFilters(node, asyncFilters, 'args');
        }
        else {
            return undefined;
        }
    });
}
function liftSuper(ast) {
    return walk(ast, (blockNode) => {
        if (!(blockNode instanceof nodes_1.default.Block)) {
            return;
        }
        let hasSuper = false;
        const symbol = gensym();
        blockNode.body = walk(blockNode.body, (node) => {
            if (node instanceof nodes_1.default.FunCall && node.name.value === 'super') {
                hasSuper = true;
                return new nodes_1.default.Symbol(node.lineno, node.colno, symbol);
            }
        });
        if (hasSuper) {
            blockNode.body.children.unshift(new nodes_1.default.Super(0, 0, blockNode.name, new nodes_1.default.Symbol(0, 0, symbol)));
        }
    });
}
function convertStatements(ast) {
    return depthWalk(ast, (node) => {
        if (!(node instanceof nodes_1.default.If) && !(node instanceof nodes_1.default.For)) {
            return undefined;
        }
        let async = false;
        walk(node, (child) => {
            if (child instanceof nodes_1.default.FilterAsync ||
                child instanceof nodes_1.default.IfAsync ||
                child instanceof nodes_1.default.AsyncEach ||
                child instanceof nodes_1.default.AsyncAll ||
                child instanceof nodes_1.default.CallExtensionAsync) {
                async = true;
                // Stop iterating by returning the node
                return child;
            }
            return undefined;
        });
        if (async) {
            if (node instanceof nodes_1.default.If) {
                return new nodes_1.default.IfAsync(node.lineno, node.colno, node.cond, node.body, node.else_);
            }
            else if (node instanceof nodes_1.default.For && !(node instanceof nodes_1.default.AsyncAll)) {
                return new nodes_1.default.AsyncEach(node.lineno, node.colno, node.arr, node.name, node.body, node.else_);
            }
        }
        return undefined;
    });
}
function cps(ast, asyncFilters) {
    return convertStatements(liftSuper(liftFilters(ast, asyncFilters)));
}
function transform(ast, asyncFilters) {
    return cps(ast, asyncFilters || []);
}
// var parser = require('./parser');
// var src = 'hello {% foo %}{% endfoo %} end';
// var ast = transform(parser.parse(src, [new FooExtension()]), ['bar']);
// nodes.printNodes(ast);
module.exports = {
    transform: transform
};
//# sourceMappingURL=transformer.js.map