
export default class TemplateError
{
	message;
	template;
	line;
	column;

	constructor(message:string,template,line,column) 
	{
		this.message = message;
		this.template = template;
		this.line = line;
		this.column = column;
	}

	static fromError(err:Error,template,line,column)
	{
//TODO copy stack trace over?	
		return new TemplateError(err.toString(),template,line,column);
	}
}

