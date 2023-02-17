import Template from './Template';
import SlimEnvironment from './SlimEnvironment';

export {default as FileSystemLoader} from '../loaders/FileSystemLoader';
export {default as WebLoader} from '../loaders/WebLoader';

export default class Environment extends SlimEnvironment
{
	protected createTemplate(src,env:SlimEnvironment,path:string)
	{
		return new Template(src,env,path);
	}
}

