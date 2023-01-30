'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.precompileString = exports.precompile = exports.renderString = exports.asyncRender = exports.render = exports.compile = exports.reset = exports.configure = exports.installJinjaCompat = exports.nodes = exports.lib = exports.runtime = exports.lexer = exports.parser = exports.compiler = exports.Loader = exports.Template = exports.Environment = exports.WebLoader = exports.PrecompiledLoader = exports.NodeResolveLoader = exports.FileSystemLoader = void 0;
const lib_1 = __importDefault(require("./src/lib"));
exports.lib = lib_1.default;
const environment_1 = require("./src/environment");
Object.defineProperty(exports, "Environment", { enumerable: true, get: function () { return environment_1.Environment; } });
Object.defineProperty(exports, "Template", { enumerable: true, get: function () { return environment_1.Template; } });
const loader_1 = __importDefault(require("./src/loader"));
exports.Loader = loader_1.default;
const loaders = __importStar(require("./src/loaders"));
const precompile_1 = __importDefault(require("./src/precompile"));
const compiler_1 = __importDefault(require("./src/compiler"));
exports.compiler = compiler_1.default;
const parser_1 = __importDefault(require("./src/parser"));
exports.parser = parser_1.default;
const lexer_1 = __importDefault(require("./src/lexer"));
exports.lexer = lexer_1.default;
const runtime_1 = __importDefault(require("./src/runtime"));
exports.runtime = runtime_1.default;
const nodes_1 = __importDefault(require("./src/nodes"));
exports.nodes = nodes_1.default;
const jinja_compat_1 = __importDefault(require("./src/jinja-compat"));
exports.installJinjaCompat = jinja_compat_1.default;
// A single instance of an environment, since this is so commonly used
let e;
function configure(templatesPath = undefined, opts = undefined) {
    opts = opts || {};
    if (lib_1.default.isObject(templatesPath)) {
        opts = templatesPath;
        templatesPath = null;
    }
    let TemplateLoader;
    if (loaders.FileSystemLoader)
        TemplateLoader = new loaders.FileSystemLoader(templatesPath, {
            watch: opts.watch,
            noCache: opts.noCache
        });
    else if (loaders.WebLoader)
        TemplateLoader = new loaders.WebLoader(templatesPath, {
            useCache: opts.web && opts.web.useCache,
            async: opts.web && opts.web.async
        });
    e = new environment_1.Environment(TemplateLoader, opts);
    if (opts && opts.express)
        e.express(opts.express);
    return e;
}
exports.configure = configure;
exports.FileSystemLoader = loaders.FileSystemLoader;
exports.NodeResolveLoader = loaders.NodeResolveLoader;
exports.PrecompiledLoader = loaders.PrecompiledLoader;
exports.WebLoader = loaders.WebLoader;
function reset() {
    e = undefined;
}
exports.reset = reset;
function compile(src, env, path, eagerCompile) {
    if (!e)
        configure();
    return new environment_1.Template(src, env, path, eagerCompile);
}
exports.compile = compile;
function render(name, ctx, cb) {
    if (!e)
        configure();
    return e.render(name, ctx, cb);
}
exports.render = render;
//XXX in time use this to replace old render()
async function asyncRender(name, ctx) {
    if (!e)
        configure();
    return await e.asyncRender(name, ctx);
}
exports.asyncRender = asyncRender;
function renderString(src, ctx, cb) {
    if (!e)
        configure();
    return e.renderString(src, ctx, cb);
}
exports.renderString = renderString;
//FIXME precompile can be undefined in which case these should not be exported
exports.precompile = precompile_1.default.precompile;
exports.precompileString = precompile_1.default.precompileString;
//# sourceMappingURL=index.js.map