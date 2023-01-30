export class WebLoader {
    constructor(baseURL: any, opts: any);
    baseURL: any;
    useCache: boolean;
    async: boolean;
    resolve(from: any, to: any): void;
    getSource(name: any, cb: any): undefined;
    fetch(url: any, cb: any): void;
}
import { PrecompiledLoader } from "./precompiled-loader.js";
export { PrecompiledLoader };
//# sourceMappingURL=web-loaders.d.ts.map