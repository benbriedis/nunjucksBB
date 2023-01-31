'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrecompiledLoader = void 0;
const loader_1 = __importDefault(require("./loader"));
class PrecompiledLoader extends loader_1.default {
    precompiled;
    constructor(compiledTemplates) {
        super();
        this.precompiled = compiledTemplates || {};
    }
    getSource(name) {
        if (this.precompiled[name])
            return {
                src: {
                    type: 'code',
                    obj: this.precompiled[name]
                },
                path: name
            };
        return null;
    }
}
exports.PrecompiledLoader = PrecompiledLoader;
//# sourceMappingURL=precompiled-loader.js.map