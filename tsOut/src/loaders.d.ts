import * as node from './node-loaders';
import * as web from './web-loaders';
export * from './node-loaders';
export * from './web-loaders';
declare const _default: {
    FileSystemLoader: typeof node.FileSystemLoader;
    PrecompiledLoader: typeof node.PrecompiledLoader;
    NodeResolveLoader: typeof node.NodeResolveLoader;
    WebLoader: typeof web.WebLoader;
};
export default _default;
//# sourceMappingURL=loaders.d.ts.map