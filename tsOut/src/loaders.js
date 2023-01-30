"use strict";
// This file will automatically be rewired to web-loader.js when
// building for the browser
//export default './node-loaders';
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebLoader = exports.NodeResolveLoader = exports.PrecompiledLoader = exports.FileSystemLoader = void 0;
var node_loaders_1 = require("./node-loaders");
Object.defineProperty(exports, "FileSystemLoader", { enumerable: true, get: function () { return node_loaders_1.FileSystemLoader; } });
Object.defineProperty(exports, "PrecompiledLoader", { enumerable: true, get: function () { return node_loaders_1.PrecompiledLoader; } });
Object.defineProperty(exports, "NodeResolveLoader", { enumerable: true, get: function () { return node_loaders_1.NodeResolveLoader; } });
var web_loaders_1 = require("./web-loaders");
Object.defineProperty(exports, "WebLoader", { enumerable: true, get: function () { return web_loaders_1.WebLoader; } });
//# sourceMappingURL=loaders.js.map