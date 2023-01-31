"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = __importDefault(require("../index.js"));
const promises_1 = require("fs/promises");
//import nunjucks from 'nunjucks';
//import NunjucksExtensions from 'Browser/NunjucksEnv';
class RunPrecompiled {
    static async run() {
        const compiledName = 'tsOut/compiledTemplates.njk.js';
        const handle = await (0, promises_1.open)(compiledName, 'r');
        const contents = await handle.readFile({ encoding: 'UTF-8' });
        await handle.close();
        console.log('GOT CONTENTS:', contents);
        //		EXECUTE contents
        ///////////////////
        const env = new index_js_1.default.Environment(new index_js_1.default.WebLoader('/xxxx'), {
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
        //XXX can/should I combine these two?
        const template = env.getTemplate(templateName, true); //XXX true?
        const content = template.render(data);
        console.log(content);
    }
}
exports.default = RunPrecompiled;
RunPrecompiled.run().catch(err => console.log(err));
//# sourceMappingURL=RunPrecompiled.js.map