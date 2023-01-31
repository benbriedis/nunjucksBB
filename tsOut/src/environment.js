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
exports.Template = exports.Environment = void 0;
const asap_1 = __importDefault(require("asap"));
const a_sync_waterfall_1 = __importDefault(require("a-sync-waterfall"));
const lib_1 = __importDefault(require("./lib"));
const compiler_1 = __importDefault(require("./compiler"));
//import filters from './filters';
const filters = require('./filters');
const loaders_1 = require("./loaders");
const tests_1 = __importDefault(require("./tests"));
const globals_1 = __importDefault(require("./globals"));
const object_1 = require("./object");
const runtime_1 = __importStar(require("./runtime"));
const express_app_1 = __importDefault(require("./express-app"));
// If the user is using the async API, *always* call it
// asynchronously even if the template was synchronous.
function callbackAsap(cb, err, res = undefined) {
    (0, asap_1.default)(() => {
        cb(err, res);
    });
}
/**
 * A no-op template, for use with {% include ignore missing %}
 */
const noopTmplSrc = {
    type: 'code',
    obj: {
        root(env, context, frame, runtime, cb) {
            try {
                cb(null, '');
            }
            catch (e) {
                cb((0, runtime_1.handleError)(e, null, null));
            }
        }
    }
};
//XXX use an emit mixin
class Environment extends object_1.EmitterObj2 {
    globals;
    filters = {};
    tests = {};
    asyncFilters = [];
    extensions = {};
    extensionsList = [];
    opts;
    //FIXME only working with 'declare' present. No idea why	
    loaders; //XXX public for testing only
    //	public loaders: Loader[];  //XXX public for testing only
    constructor(loaders, opts) {
        super();
        // The dev flag determines the trace that'll be shown on errors.
        // If set to true, returns the full trace from the error point,
        // otherwise will return trace starting from Template.render
        // (the full trace from within nunjucks may confuse developers using
        //  the library)
        // defaults to false
        opts = this.opts = opts || {};
        this.opts.dev = !!opts.dev;
        // The autoescape flag sets global autoescaping. If true,
        // every string variable will be escaped by default.
        // If false, strings can be manually escaped using the `escape` filter.
        // defaults to true
        this.opts.autoescape = opts.autoescape != null ? opts.autoescape : true;
        // If true, this will make the system throw errors if trying
        // to output a null or undefined value
        this.opts.throwOnUndefined = !!opts.throwOnUndefined;
        this.opts.trimBlocks = !!opts.trimBlocks;
        this.opts.lstripBlocks = !!opts.lstripBlocks;
        this.loaders = [];
        if (!loaders) {
            // The filesystem loader is only available server-side
            if (loaders_1.FileSystemLoader)
                this.loaders = [new loaders_1.FileSystemLoader('views')];
            else if (loaders_1.WebLoader)
                this.loaders = [new loaders_1.WebLoader('/views')];
        }
        else
            this.loaders = lib_1.default.isArray(loaders) ? loaders : [loaders];
        // It's easy to use precompiled templates: just include them
        // before you configure nunjucks and this will automatically
        // pick it up and use it
        if (typeof window !== 'undefined' && window.nunjucksPrecompiled)
            this.loaders.unshift(new loaders_1.PrecompiledLoader(window.nunjucksPrecompiled));
        this._initLoaders();
        this.globals = (0, globals_1.default)();
        this.filters = {};
        this.tests = {};
        this.asyncFilters = [];
        this.extensions = {};
        this.extensionsList = [];
        lib_1.default._entries(filters).forEach(([name, filter]) => this.addFilter(name, filter));
        lib_1.default._entries(tests_1.default).forEach(([name, test]) => this.addTest(name, test));
    }
    _initLoaders() {
        const me = this;
        this.loaders.forEach(loader => {
            // Caching and cache busting
            loader.cache = {};
            if (typeof loader.on === 'function') {
                loader.on('update', function (name, fullname) {
                    loader.cache[name] = null;
                    //FIXME use a mixin to support emit?
                    me.emit('update', name, fullname, loader);
                });
                //XXX BB possibly just used for Chokidar
                loader.on('load', function (name, source) {
                    me.emit('load', name, source, loader);
                });
            }
        });
    }
    invalidateCache() {
        this.loaders.forEach((loader) => {
            loader.cache = {};
        });
    }
    addExtension(name, extension) {
        extension.__name = name;
        this.extensions[name] = extension;
        this.extensionsList.push(extension);
        return this;
    }
    removeExtension(name) {
        var extension = this.getExtension(name);
        if (!extension)
            return;
        this.extensionsList = lib_1.default.without(this.extensionsList, extension);
        delete this.extensions[name];
    }
    getExtension(name) {
        return this.extensions[name];
    }
    hasExtension(name) {
        return !!this.extensions[name];
    }
    addGlobal(name, value) {
        this.globals[name] = value;
        return this;
    }
    getGlobal(name) {
        if (typeof this.globals[name] === 'undefined')
            throw new Error('global not found: ' + name);
        return this.globals[name];
    }
    addFilter(name, func, async = undefined) {
        var wrapped = func;
        if (async)
            this.asyncFilters.push(name);
        this.filters[name] = wrapped;
        return this;
    }
    getFilter(name) {
        if (!this.filters[name])
            throw new Error('filter not found: ' + name);
        return this.filters[name];
    }
    addTest(name, func) {
        this.tests[name] = func;
        return this;
    }
    getTest(name) {
        if (!this.tests[name])
            throw new Error('test not found: ' + name);
        return this.tests[name];
    }
    resolveTemplate(loader, parentName, filename) {
        var isRelative = (loader.isRelative && parentName) ? loader.isRelative(filename) : false;
        return (isRelative && loader.resolve) ? loader.resolve(parentName, filename) : filename;
    }
    getTemplate(name, eagerCompile, parentName = undefined, ignoreMissing = undefined, cb = undefined) {
        var that = this;
        var tmpl = null;
        if (name && name.raw)
            // this fixes autoescape for templates referenced in symbols
            name = name.raw;
        if (lib_1.default.isFunction(parentName)) {
            cb = parentName;
            parentName = null;
            eagerCompile = eagerCompile || false;
        }
        if (lib_1.default.isFunction(eagerCompile)) {
            cb = eagerCompile;
            eagerCompile = false;
        }
        if (name instanceof Template)
            tmpl = name;
        else if (typeof name !== 'string')
            throw new Error('template names must be a string: ' + name);
        else {
            for (let i = 0; i < this.loaders.length; i++) {
                const loader = this.loaders[i];
                tmpl = loader.cache[this.resolveTemplate(loader, parentName, name)];
                if (tmpl)
                    break;
            }
        }
        if (tmpl) {
            if (eagerCompile)
                tmpl.compile();
            if (cb) {
                cb(null, tmpl);
                return undefined;
            }
            else
                return tmpl;
        }
        let syncResult;
        const createTemplate = (err, info) => {
            if (!info && !err && !ignoreMissing)
                err = new Error('template not found: ' + name);
            if (err) {
                if (cb) {
                    cb(err);
                    return;
                }
                else
                    throw err;
            }
            let newTmpl;
            if (!info)
                newTmpl = new Template(noopTmplSrc, this, '', eagerCompile);
            else {
                newTmpl = new Template(info.src, this, info.path, eagerCompile);
                if (!info.noCache)
                    info.loader.cache[name] = newTmpl;
            }
            if (cb)
                cb(null, newTmpl);
            else
                syncResult = newTmpl;
        };
        lib_1.default.asyncIter(this.loaders, (loader, i, next, done) => {
            function handle(err, src) {
                if (err)
                    done(err);
                else if (src) {
                    src.loader = loader;
                    done(null, src);
                }
                else
                    next();
            }
            // Resolve name relative to parentName
            name = that.resolveTemplate(loader, parentName, name);
            if (loader.async)
                loader.getSource(name, handle);
            else
                handle(null, loader.getSource(name));
        }, createTemplate);
        return syncResult;
    }
    express(app) {
        return (0, express_app_1.default)(this, app);
    }
    render(name, ctx, cb) {
        if (lib_1.default.isFunction(ctx)) {
            cb = ctx;
            ctx = null;
        }
        // We support a synchronous API to make it easier to migrate
        // existing code to async. This works because if you don't do
        // anything async work, the whole thing is actually run
        // synchronously.
        let syncResult = null;
        this.getTemplate(name, (err, tmpl) => {
            if (err && cb)
                callbackAsap(cb, err);
            else if (err)
                throw err;
            else
                syncResult = tmpl.render(ctx, cb);
        });
        return syncResult;
    }
    renderString(src, ctx, opts, cb) {
        if (lib_1.default.isFunction(opts)) {
            cb = opts;
            opts = {};
        }
        opts = opts || {};
        const tmpl = new Template(src, this, opts.path);
        return tmpl.render(ctx, cb);
    }
    waterfall(tasks, callback, forceAsync) {
        return (0, a_sync_waterfall_1.default)(tasks, callback, forceAsync);
    }
}
exports.Environment = Environment;
//TODO split into separate files
class Context extends object_1.Obj2 {
    env;
    ctx;
    blocks;
    exported;
    constructor(ctx, blocks, env) {
        super();
        // Has to be tied to an environment so we can tap into its globals.
        this.env = env || new Environment();
        // Make a duplicate of ctx
        this.ctx = lib_1.default.extend({}, ctx);
        this.blocks = {};
        this.exported = [];
        lib_1.default.keys(blocks).forEach(name => {
            this.addBlock(name, blocks[name]);
        });
    }
    lookup(name) {
        // This is one of the most called functions, so optimize for
        // the typical case where the name isn't in the globals
        if (name in this.env.globals && !(name in this.ctx))
            return this.env.globals[name];
        else
            return this.ctx[name];
    }
    setVariable(name, val) {
        this.ctx[name] = val;
    }
    getVariables() {
        return this.ctx;
    }
    addBlock(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);
        return this;
    }
    getBlock(name) {
        if (!this.blocks[name])
            throw new Error('unknown block "' + name + '"');
        return this.blocks[name][0];
    }
    getSuper(env, name, block, frame, runtime, cb) {
        var idx = lib_1.default.indexOf(this.blocks[name] || [], block);
        var blk = this.blocks[name][idx + 1];
        var context = this;
        if (idx === -1 || !blk)
            throw new Error('no super block available for "' + name + '"');
        blk(env, context, frame, runtime, cb);
    }
    addExport(name) {
        this.exported.push(name);
    }
    getExported() {
        var exported = {};
        this.exported.forEach((name) => {
            exported[name] = this.ctx[name];
        });
        return exported;
    }
}
class Template extends object_1.Obj2 {
    env;
    path;
    tmplProps;
    tmplStr;
    compiled;
    blocks;
    rootRenderFunc;
    constructor(src, env, path, eagerCompile = undefined) {
        super();
        this.env = env || new Environment();
        if (lib_1.default.isObject(src)) {
            switch (src.type) {
                case 'code':
                    this.tmplProps = src.obj;
                    break;
                case 'string':
                    this.tmplStr = src.obj;
                    break;
                default:
                    throw new Error(`Unexpected template object type ${src.type}; expected 'code', or 'string'`);
            }
        }
        else if (lib_1.default.isString(src))
            this.tmplStr = src;
        else
            throw new Error('src must be a string or an object describing the source');
        this.path = path;
        if (eagerCompile)
            try {
                this._compile();
            }
            catch (err) {
                throw lib_1.default._prettifyError(this.path, this.env.opts.dev, err);
            }
        else
            this.compiled = false;
    }
    render(ctx, parentFrame, cb = undefined) {
        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = {};
        }
        else if (typeof parentFrame === 'function') {
            cb = parentFrame;
            parentFrame = null;
        }
        // If there is a parent frame, we are being called from internal
        // code of another template, and the internal system
        // depends on the sync/async nature of the parent template
        // to be inherited, so force an async callback
        const forceAsync = !parentFrame;
        // Catch compile errors for async rendering
        try {
            this.compile();
        }
        catch (e) {
            const err = lib_1.default._prettifyError(this.path, this.env.opts.dev, e);
            if (cb)
                return callbackAsap(cb, err);
            else
                throw err;
        }
        const context = new Context(ctx || {}, this.blocks, this.env);
        const frame = parentFrame ? parentFrame.push(true) : new runtime_1.Frame();
        frame.topLevel = true;
        let syncResult = null;
        let didError = false;
        this.rootRenderFunc(this.env, context, frame, runtime_1.default, (err, res) => {
            // TODO: this is actually a bug in the compiled template (because waterfall
            // tasks are both not passing errors up the chain of callbacks AND are not
            // causing a return from the top-most render function). But fixing that
            // will require a more substantial change to the compiler.
            if (didError && cb && typeof res !== 'undefined')
                // prevent multiple calls to cb
                return;
            if (err) {
                err = lib_1.default._prettifyError(this.path, this.env.opts.dev, err);
                didError = true;
            }
            if (cb) {
                if (forceAsync)
                    callbackAsap(cb, err, res);
                else
                    cb(err, res);
            }
            else {
                if (err)
                    throw err;
                syncResult = res;
            }
        });
        return syncResult;
    }
    getExported(ctx, parentFrame, cb) {
        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = {};
        }
        if (typeof parentFrame === 'function') {
            cb = parentFrame;
            parentFrame = null;
        }
        // Catch compile errors for async rendering
        try {
            this.compile();
        }
        catch (e) {
            if (cb)
                return cb(e);
            else
                throw e;
        }
        const frame = parentFrame ? parentFrame.push() : new runtime_1.Frame();
        frame.topLevel = true;
        // Run the rootRenderFunc to populate the context with exported vars
        const context = new Context(ctx || {}, this.blocks, this.env);
        this.rootRenderFunc(this.env, context, frame, runtime_1.default, (err) => {
            if (err)
                cb(err, null);
            else
                cb(null, context.getExported());
        });
    }
    compile() {
        if (!this.compiled)
            this._compile();
    }
    _compile() {
        var props;
        if (this.tmplProps)
            props = this.tmplProps;
        else {
            const source = compiler_1.default.compile(this.tmplStr, this.env.asyncFilters, this.env.extensionsList, this.path, this.env.opts);
            const func = new Function(source); // eslint-disable-line no-new-func
            props = func();
        }
        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
        this.compiled = true;
    }
    _getBlocks(props) {
        var blocks = {};
        lib_1.default.keys(props).forEach((k) => {
            if (k.slice(0, 2) === 'b_')
                blocks[k.slice(2)] = props[k];
        });
        return blocks;
    }
}
exports.Template = Template;
//# sourceMappingURL=environment.js.map