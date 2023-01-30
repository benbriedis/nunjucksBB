/* eslint-disable no-console */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeResolveLoader = exports.PrecompiledLoader = exports.FileSystemLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loader_1 = __importDefault(require("./loader"));
const precompiled_loader_js_1 = require("./precompiled-loader.js");
Object.defineProperty(exports, "PrecompiledLoader", { enumerable: true, get: function () { return precompiled_loader_js_1.PrecompiledLoader; } });
let chokidar;
class FileSystemLoader extends loader_1.default {
    pathsToNames;
    noCache;
    searchPaths;
    constructor(searchPaths, opts = undefined) {
        super();
        if (typeof opts === 'boolean')
            console.log('[nunjucks] Warning: you passed a boolean as the second ' +
                'argument to FileSystemLoader, but it now takes an options ' +
                'object. See http://mozilla.github.io/nunjucks/api.html#filesystemloader');
        opts = opts || {};
        this.pathsToNames = {};
        this.noCache = !!opts.noCache;
        if (searchPaths) {
            searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];
            // For windows, convert to forward slashes
            this.searchPaths = searchPaths.map(path_1.default.normalize);
        }
        else
            this.searchPaths = ['.'];
        //FIXME remove watch & chokidar
        if (opts.watch) {
            // Watch all the templates in the paths and fire an event when
            // they change
            try {
                chokidar = require('chokidar'); // eslint-disable-line global-require
            }
            catch (e) {
                throw new Error('watch requires chokidar to be installed');
            }
            const paths = this.searchPaths.filter(fs_1.default.existsSync);
            const watcher = chokidar.watch(paths);
            watcher.on('all', function (event, fullname) {
                fullname = path_1.default.resolve(fullname);
                if (event === 'change' && fullname in this.pathsToNames)
                    this.emit('update', this.pathsToNames[fullname], fullname);
            });
            watcher.on('error', (error) => {
                console.log('Watcher error: ' + error);
            });
        }
    }
    getSource(name) {
        var fullpath = null;
        var paths = this.searchPaths;
        for (let i = 0; i < paths.length; i++) {
            const basePath = path_1.default.resolve(paths[i]);
            const p = path_1.default.resolve(paths[i], name);
            // Only allow the current directory and anything
            // underneath it to be searched
            if (p.indexOf(basePath) === 0 && fs_1.default.existsSync(p)) {
                fullpath = p;
                break;
            }
        }
        if (!fullpath)
            return null;
        this.pathsToNames[fullpath] = name;
        const source = {
            src: fs_1.default.readFileSync(fullpath, 'utf-8'),
            path: fullpath,
            noCache: this.noCache
        };
        this.emit('load', name, source);
        return source;
    }
}
exports.FileSystemLoader = FileSystemLoader;
class NodeResolveLoader extends loader_1.default {
    pathsToNames = {};
    noCache;
    watcher;
    constructor(opts) {
        super();
        opts = opts || {};
        this.pathsToNames = {};
        this.noCache = !!opts.noCache;
        if (opts.watch) {
            try {
                chokidar = require('chokidar'); // eslint-disable-line global-require
            }
            catch (e) {
                throw new Error('watch requires chokidar to be installed');
            }
            this.watcher = chokidar.watch();
            this.watcher.on('change', function (fullname) {
                this.emit('update', this.pathsToNames[fullname], fullname);
            });
            this.watcher.on('error', error => {
                console.log('Watcher error: ' + error);
            });
            this.on('load', function (name, source) {
                this.watcher.add(source.path);
            });
        }
    }
    getSource(name) {
        // Don't allow file-system traversal
        if ((/^\.?\.?(\/|\\)/).test(name))
            return null;
        if ((/^[A-Z]:/).test(name))
            return null;
        let fullpath;
        try {
            fullpath = require.resolve(name);
        }
        catch (e) {
            return null;
        }
        this.pathsToNames[fullpath] = name;
        const source = {
            src: fs_1.default.readFileSync(fullpath, 'utf-8'),
            path: fullpath,
            noCache: this.noCache,
        };
        this.emit('load', name, source);
        return source;
    }
}
exports.NodeResolveLoader = NodeResolveLoader;
//# sourceMappingURL=node-loaders.js.map