// This file will automatically be rewired to web-loader.js when
// building for the browser
//export default './node-loaders';

export {default as FileSystemLoader} from './FileSystemLoader';
export {default as PrecompiledLoader} from './PrecompiledLoader';
export {default as WebLoader} from './WebLoader';

