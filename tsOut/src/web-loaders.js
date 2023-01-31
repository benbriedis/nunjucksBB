'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebLoader = exports.PrecompiledLoader = void 0;
const loader_1 = __importDefault(require("./loader"));
const precompiled_loader_js_1 = require("./precompiled-loader.js");
Object.defineProperty(exports, "PrecompiledLoader", { enumerable: true, get: function () { return precompiled_loader_js_1.PrecompiledLoader; } });
class WebLoader extends loader_1.default {
    baseURL;
    useCache;
    async;
    constructor(baseURL, opts = undefined) {
        super();
        this.baseURL = baseURL || '.';
        opts = opts || {};
        // By default, the cache is turned off because there's no way
        // to "watch" templates over HTTP, so they are re-downloaded
        // and compiled each time. (Remember, PRECOMPILE YOUR
        // TEMPLATES in production!)
        this.useCache = !!opts.useCache;
        // We default `async` to false so that the simple synchronous
        // API can be used when you aren't doing anything async in
        // your templates (which is most of the time). This performs a
        // sync ajax request, but that's ok because it should *only*
        // happen in development. PRECOMPILE YOUR TEMPLATES.
        this.async = !!opts.async;
    }
    resolve(from, to) {
        throw new Error('relative templates not support in the browser yet');
    }
    getSource(name, cb) {
        var useCache = this.useCache;
        var result;
        this.fetch(this.baseURL + '/' + name, (err, src) => {
            if (err) {
                if (cb) {
                    cb(err.content);
                }
                else if (err.status === 404) {
                    result = null;
                }
                else {
                    throw err.content;
                }
            }
            else {
                result = {
                    src: src,
                    path: name,
                    noCache: !useCache
                };
                this.emit('load', name, result);
                if (cb) {
                    cb(null, result);
                }
            }
        });
        // if this WebLoader isn't running asynchronously, the
        // fetch above would actually run sync and we'll have a
        // result here
        return result;
    }
    fetch(url, cb) {
        // Only in the browser please
        if (typeof window === 'undefined') {
            throw new Error('WebLoader can only by used in a browser');
        }
        const ajax = new XMLHttpRequest();
        let loading = true;
        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4 && loading) {
                loading = false;
                if (ajax.status === 0 || ajax.status === 200) {
                    cb(null, ajax.responseText);
                }
                else {
                    cb({
                        status: ajax.status,
                        content: ajax.responseText
                    });
                }
            }
        };
        url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
            (new Date().getTime());
        ajax.open('GET', url, this.async);
        ajax.send();
    }
}
exports.WebLoader = WebLoader;
//# sourceMappingURL=web-loaders.js.map