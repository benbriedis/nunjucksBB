'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = __importDefault(require("./src/lib"));
const environment_1 = require("./src/environment");
const loader_1 = __importDefault(require("./src/loader"));
const loaders_1 = __importDefault(require("./src/loaders"));
const precompile_1 = __importDefault(require("./src/precompile"));
const compiler_1 = __importDefault(require("./src/compiler"));
const parser_1 = __importDefault(require("./src/parser"));
const lexer_1 = __importDefault(require("./src/lexer"));
const runtime_1 = __importDefault(require("./src/runtime"));
const nodes_1 = __importDefault(require("./src/nodes"));
const jinja_compat_1 = __importDefault(require("./src/jinja-compat"));
// A single instance of an environment, since this is so commonly used
let e;
function configure(templatesPath = undefined, opts = undefined) {
    opts = opts || {};
    if (lib_1.default.isObject(templatesPath)) {
        opts = templatesPath;
        templatesPath = null;
    }
    let templateLoader;
    if (loaders_1.default.FileSystemLoader)
        templateLoader = new loaders_1.default.FileSystemLoader(templatesPath, {
            watch: opts.watch,
            noCache: opts.noCache
        });
    else if (loaders_1.default.WebLoader)
        templateLoader = new loaders_1.default.WebLoader(templatesPath, {
            useCache: opts.web && opts.web.useCache,
            async: opts.web && opts.web.async
        });
    e = new environment_1.Environment(templateLoader, opts);
    if (opts && opts.express)
        e.express(opts.express);
    return e;
}
function reset() {
    e = undefined;
}
function compile(src, env, path, eagerCompile) {
    if (!e)
        configure();
    return new environment_1.Template(src, env, path, eagerCompile);
}
function render(name, ctx, cb = undefined) {
    if (!e)
        configure();
    return e.render(name, ctx, cb);
}
//XXX in time use this to replace old render()
async function asyncRender(name, ctx) {
    if (!e)
        configure();
    return await e.asyncRender(name, ctx);
}
function renderString(src, ctx, cb) {
    if (!e)
        configure();
    return e.renderString(src, ctx, cb);
}
//XXX BB for the moment Ive had to add lots of exports to things that dont need to be exported
//       separately to keep TS happy, in nodes, compiler, parser, lexer and runtime
//       MAYBE MOVE OVER TO USING <any> as for nodes below
exports.default = {
    Environment: environment_1.Environment,
    Template: environment_1.Template,
    Loader: loader_1.default,
    FileSystemLoader: loaders_1.default.FileSystemLoader,
    NodeResolveLoader: loaders_1.default.NodeResolveLoader,
    PrecompiledLoader: loaders_1.default.PrecompiledLoader,
    WebLoader: loaders_1.default.WebLoader,
    compiler: compiler_1.default,
    parser: parser_1.default,
    lexer: lexer_1.default,
    runtime: runtime_1.default,
    lib: lib_1.default,
    nodes: nodes_1.default,
    installJinjaCompat: jinja_compat_1.default,
    configure: configure,
    reset: reset,
    compile: compile,
    render: render,
    renderString: renderString,
    precompile: (precompile_1.default) ? precompile_1.default.precompile : undefined,
    precompileString: (precompile_1.default) ? precompile_1.default.precompileString : undefined,
};
//# sourceMappingURL=index.js.map