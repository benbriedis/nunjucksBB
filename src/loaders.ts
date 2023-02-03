// This file will automatically be rewired to web-loader.js when
// building for the browser
//export default './node-loaders';

import { FileSystemLoader,NodeResolveLoader,PrecompiledLoader } from './node-loaders';
import {WebLoader} from './web-loaders';

export const Loaders =  {
	FileSystemLoader:FileSystemLoader,
	PrecompiledLoader:PrecompiledLoader,
	NodeResolveLoader:NodeResolveLoader,
	WebLoader:WebLoader
};

export default Loaders;
