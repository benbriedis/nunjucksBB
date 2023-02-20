import {Blocks} from '../runtime/SlimTemplate';


//TODO fix up these confusing names and types
export type LoaderSourceSrc = string | {
//	type:'code'|'string';
	type:string;
	obj: Blocks
};

export interface LoaderSource {
    src: LoaderSourceSrc;
    path: string;
    noCache?: boolean;
}


//export type TemplateCallback<T> = (err: lib.TemplateError | null, res: T | null) => void;
export type Callback<E, T> = (err: E | null, res: T | null) => void;

export abstract class Loader
{
	cache:object = {};

	/* Return null if not found */
    async getSource(name:string) : Promise<LoaderSource|null> { return <any>null; }

	createPath(from:string,to:string):string
	{
		throw new Error('relative templates not supported by this loader');
	}

	isRelative(filename:string):boolean
	{
		return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
	}
}

export default Loader;

