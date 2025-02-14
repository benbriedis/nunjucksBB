import Loader,{LoaderSource} from './Loader';

/*
	Environment doesn't always need to use a Loader. In this case use NullLoader to
	fill the gap.
 */
export default class NullLoader extends Loader 
{
	async getSource(name:string):Promise<LoaderSource|null>
	{
		throw new Error('NullLoader.getSource() shouldn\'t be called');
	}
}

