'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lib_1 = require("./lib");
const compiler_1 = __importDefault(require("./compiler"));
const environment_1 = require("./environment");
const precompile_global_1 = __importDefault(require("./precompile-global"));
function match(filename, patterns) {
    if (!Array.isArray(patterns)) {
        return false;
    }
    return patterns.some((pattern) => filename.match(pattern));
}
function precompileString(str, opts) {
    opts = opts || {};
    opts.isString = true;
    const env = opts.env || new environment_1.Environment([]);
    const wrapper = opts.wrapper || precompile_global_1.default;
    if (!opts.name) {
        throw new Error('the "name" option is required when compiling a string');
    }
    return wrapper([_precompile(str, opts.name, env)], opts);
}
function precompile(input, opts) {
    // The following options are available:
    //
    // * name: name of the template (auto-generated when compiling a directory)
    // * isString: input is a string, not a file path
    // * asFunction: generate a callable function
    // * force: keep compiling on error
    // * env: the Environment to use (gets extensions and async filters from it)
    // * include: which file/folders to include (folders are auto-included, files are auto-excluded)
    // * exclude: which file/folders to exclude (folders are auto-included, files are auto-excluded)
    // * wrapper: function(templates, opts) {...}
    //       Customize the output format to store the compiled template.
    //       By default, templates are stored in a global variable used by the runtime.
    //       A custom loader will be necessary to load your custom wrapper.
    opts = opts || {};
    const env = opts.env || new environment_1.Environment([]);
    const wrapper = opts.wrapper || precompile_global_1.default;
    if (opts.isString) {
        return precompileString(input, opts);
    }
    const pathStats = fs_1.default.existsSync(input) && fs_1.default.statSync(input);
    const precompiled = [];
    const templates = [];
    function addTemplates(dir) {
        fs_1.default.readdirSync(dir).forEach((file) => {
            const filepath = path_1.default.join(dir, file);
            let subpath = filepath.substr(path_1.default.join(input, '/').length);
            const stat = fs_1.default.statSync(filepath);
            if (stat && stat.isDirectory()) {
                subpath += '/';
                if (!match(subpath, opts.exclude)) {
                    addTemplates(filepath);
                }
            }
            else if (match(subpath, opts.include)) {
                templates.push(filepath);
            }
        });
    }
    if (pathStats.isFile()) {
        precompiled.push(_precompile(fs_1.default.readFileSync(input, 'utf-8'), opts.name || input, env));
    }
    else if (pathStats.isDirectory()) {
        addTemplates(input);
        for (let i = 0; i < templates.length; i++) {
            const name = templates[i].replace(path_1.default.join(input, '/'), '');
            try {
                precompiled.push(_precompile(fs_1.default.readFileSync(templates[i], 'utf-8'), name, env));
            }
            catch (e) {
                if (opts.force) {
                    // Don't stop generating the output if we're
                    // forcing compilation.
                    console.error(e); // eslint-disable-line no-console
                }
                else {
                    throw e;
                }
            }
        }
    }
    return wrapper(precompiled, opts);
}
function _precompile(str, name, env) {
    env = env || new environment_1.Environment([]);
    const asyncFilters = env.asyncFilters;
    const extensions = env.extensionsList;
    let template;
    name = name.replace(/\\/g, '/');
    try {
        template = compiler_1.default.compile(str, asyncFilters, extensions, name, env.opts);
    }
    catch (err) {
        throw (0, lib_1._prettifyError)(name, false, err);
    }
    return {
        name: name,
        template: template
    };
}
exports.default = {
    precompile: precompile,
    precompileString: precompileString
};
//# sourceMappingURL=precompile.js.map