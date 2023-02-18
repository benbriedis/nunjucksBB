import SlimEnvironment from './runtime/SlimEnvironment';

//XXX user doesn't really need to see this runtime stuff - only the compiled code
export * as runtime from './runtime/runtime';
export {default as SlimEnvironment} from './runtime/SlimEnvironment';
export {default as PrecompiledLoader} from './loaders/PrecompiledLoader';
export {default as NullLoader} from './loaders/NullLoader';

export default SlimEnvironment;
