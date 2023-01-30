'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = void 0;
const path_1 = __importDefault(require("path"));
const object_1 = require("./object");
class Loader extends object_1.EmitterObj {
    resolve(from, to) {
        return path_1.default.resolve(path_1.default.dirname(from), to);
    }
    isRelative(filename) {
        return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
    }
}
exports.Loader = Loader;
exports.default = Loader;
//# sourceMappingURL=loader.js.map