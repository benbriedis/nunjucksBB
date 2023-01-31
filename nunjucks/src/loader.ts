'use strict';

import path from 'path';
import {EmitterObj2} from './object';

export class Loader extends EmitterObj2 
{
	resolve(from, to) 
	{
		return path.resolve(path.dirname(from), to);
	}

	isRelative(filename) 
	{
		return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
	}
}

export default Loader;

