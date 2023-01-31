"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = __importDefault(require("../index.js"));
const promises_1 = require("fs/promises");
//import nunjucks from 'nunjucks';
//import NunjucksExtensions from 'Browser/NunjucksEnv';
class Precompile {
    static async run() {
        const env = index_js_1.default.configure({
            trimBlocks: true,
            lstripBlocks: true
            //throwOnUndefined:true
        });
        //		NunjucksExtensions.extend(this.env);
        const templateName = 'nunjucks/dev/top.njk';
        const data = {
            a: 1,
            b: 2
        };
        const handle = await (0, promises_1.open)(templateName, 'r');
        const contents = await handle.readFile({ encoding: 'UTF-8' });
        //XXX does 'precompile()' not work?
        const compiled = index_js_1.default.precompileString(contents, { name: templateName, env: env });
        console.log(compiled);
        await handle.close();
    }
}
exports.default = Precompile;
Precompile.run().catch(err => console.log(err));
//# sourceMappingURL=Precompile.js.map