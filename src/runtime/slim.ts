
//XXX probably shouldn't be exporting all of this

import Environment from './Environment';
export * as runtime from './runtime';
import PrecompiledLoader from '../loaders/PrecompiledLoader';

export function configure(precompiledCode,opts): Environment
{
	return new Environment(new PrecompiledLoader(precompiledCode), opts);
}

