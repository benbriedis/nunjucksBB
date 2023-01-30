import Loader from './loader';
import { PrecompiledLoader } from './precompiled-loader.js';
declare class FileSystemLoader extends Loader {
    pathsToNames: any;
    noCache: any;
    searchPaths: any;
    constructor(searchPaths: any, opts?: any);
    getSource(name: any): {
        src: string;
        path: any;
        noCache: any;
    };
}
declare class NodeResolveLoader extends Loader {
    pathsToNames: {};
    noCache: any;
    watcher: any;
    constructor(opts: any);
    getSource(name: any): {
        src: string;
        path: any;
        noCache: any;
    };
}
export { FileSystemLoader, PrecompiledLoader, NodeResolveLoader };
//# sourceMappingURL=node-loaders.d.ts.map