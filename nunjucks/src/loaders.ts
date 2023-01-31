// This file will automatically be rewired to web-loader.js when
// building for the browser
//export default './node-loaders';

import * as node from './node-loaders';
import * as web from './web-loaders';

export * from './node-loaders';
export * from './web-loaders';

export default {
	FileSystemLoader: node.FileSystemLoader,
	PrecompiledLoader: node.PrecompiledLoader,
	NodeResolveLoader: node.NodeResolveLoader,
	WebLoader: web.WebLoader
};
