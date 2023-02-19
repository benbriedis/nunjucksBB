
export default class TemplateError
{
	message:string;
	template:string;
	line:number;
	column:number;

	constructor(message:string,template:string,line:number,column:number) 
	{
		this.message = message;
		this.template = template;
		this.line = line;
		this.column = column;

if (global.go) (<any>this).stack = (new Error()).stack;
	}

	static fromError(err:Error,template,line,column)
	{
//TODO copy stack trace over?	
		return new TemplateError(err.toString(),template,line,column);
	}
}

