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
    async?: boolean | undefined;
 	es6Async?: boolean | undefined;

    //getSource(name: string): LoaderSource;
    getSource(name: string, callback?: Callback<Error,LoaderSource>): void {return <any>null;} ;

//XXX MAKE THIS THE ONLY OPTION
//TODO make abstract
    getSourceAsync(name: string) : Promise<LoaderSource> { return <any>null}


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

