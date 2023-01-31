import Loader from './loader';
import { PrecompiledLoader } from './precompiled-loader.js';
export { PrecompiledLoader };
export declare class WebLoader extends Loader {
    baseURL: any;
    useCache: any;
    async: any;
    constructor(baseURL: any, opts?: any);
    resolve(from: any, to: any): string;
    getSource(name: any, cb: any): any;
    fetch(url: any, cb: any): void;
}
//# sourceMappingURL=web-loaders.d.ts.map