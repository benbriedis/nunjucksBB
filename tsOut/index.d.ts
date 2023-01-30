import lib from './src/lib';
import { Environment, Template } from './src/environment';
import Loader from './src/loader';
import * as loaders from './src/loaders';
import compiler from './src/compiler';
import parser from './src/parser';
import lexer from './src/lexer';
import runtime from './src/runtime';
import nodes from './src/nodes';
import installJinjaCompat from './src/jinja-compat';
declare function configure(templatesPath?: any, opts?: any): any;
export declare const FileSystemLoader: typeof loaders.FileSystemLoader;
export declare const NodeResolveLoader: typeof loaders.NodeResolveLoader;
export declare const PrecompiledLoader: {
    new (compiledTemplates: any): {
        precompiled: any;
        getSource(name: any): {
            src: {
                type: string;
                obj: any;
            };
            path: any;
        };
    };
};
export declare const WebLoader: {
    new (baseURL: any, opts: any): {
        baseURL: any;
        useCache: boolean;
        async: boolean;
        resolve(from: any, to: any): void;
        getSource(name: any, cb: any): undefined;
        fetch(url: any, cb: any): void;
    };
};
export { Environment, Template, Loader };
export { compiler, parser, lexer, runtime, lib, nodes, installJinjaCompat, configure };
export declare function reset(): void;
export declare function compile(src: any, env: any, path: any, eagerCompile: any): Template;
export declare function render(name: any, ctx: any, cb: any): any;
export declare function asyncRender(name: any, ctx: any): Promise<any>;
export declare function renderString(src: any, ctx: any, cb: any): any;
export declare const precompile: (input: any, opts: any) => any;
export declare const precompileString: (str: any, opts: any) => any;
//# sourceMappingURL=index.d.ts.map