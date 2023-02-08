'use strict';

import path from 'path';
import {EmitterObj2} from './object';

export interface LoaderSource {
    src: string;
    path: string;
    noCache: boolean;
}

//export type TemplateCallback<T> = (err: lib.TemplateError | null, res: T | null) => void;
export type Callback<E, T> = (err: E | null, res: T | null) => void;

export abstract class Loader extends EmitterObj2 
{
    async getSource(name:string) : Promise<LoaderSource> { return <any>null; }

	createPath(from:string,to:string):string
	{
		return path.resolve(path.dirname(from), to);
	}

	isRelative(filename:string):boolean
	{
		return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
	}
}

export default Loader;

