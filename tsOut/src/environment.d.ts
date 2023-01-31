import type Loader from './loader';
import { Obj2, EmitterObj2 } from './object';
declare class Environment extends EmitterObj2 {
    globals: any;
    filters: {};
    tests: {};
    asyncFilters: any[];
    extensions: {};
    extensionsList: any[];
    opts: any;
    loaders: any;
    constructor(loaders?: Loader | Loader[], opts?: any);
    _initLoaders(): void;
    invalidateCache(): void;
    addExtension(name: any, extension: any): this;
    removeExtension(name: any): void;
    getExtension(name: any): any;
    hasExtension(name: any): boolean;
    addGlobal(name: any, value: any): this;
    getGlobal(name: any): any;
    addFilter(name: any, func: any, async?: any): this;
    getFilter(name: any): any;
    addTest(name: any, func: any): this;
    getTest(name: any): any;
    resolveTemplate(loader: any, parentName: any, filename: any): any;
    getTemplate(name: any, eagerCompile: any, parentName?: any, ignoreMissing?: any, cb?: any): any;
    express(app: any): any;
    render(name: any, ctx: any, cb: any): any;
    renderString(src: any, ctx: any, opts: any, cb: any): any;
    waterfall(tasks: any, callback: any, forceAsync: any): any;
}
declare class Template extends Obj2 {
    env: any;
    path: any;
    tmplProps: any;
    tmplStr: any;
    compiled: any;
    blocks: any;
    rootRenderFunc: any;
    constructor(src: any, env: any, path: any, eagerCompile?: any);
    render(ctx: any, parentFrame: any, cb?: any): any;
    getExported(ctx: any, parentFrame: any, cb: any): any;
    compile(): void;
    _compile(): void;
    _getBlocks(props: any): {};
}
export { Environment, Template };
//# sourceMappingURL=environment.d.ts.map