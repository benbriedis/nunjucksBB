export interface LoaderSource {
    src: string;
    path: string;
    noCache: boolean;
}

//export type TemplateCallback<T> = (err: lib.TemplateError | null, res: T | null) => void;
export type Callback<E, T> = (err: E | null, res: T | null) => void;

export abstract class Loader
{
    async getSource(name:string) : Promise<LoaderSource> { return <any>null; }

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

