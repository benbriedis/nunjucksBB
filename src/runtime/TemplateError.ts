
export default class TemplateError
{
	readonly message:string;
	readonly template:string;
	readonly line:number;
	readonly column:number;

	constructor(message:string,template:string,line:number,column:number) 
	{
		this.message = message;
		this.template = template;
		this.line = line;
		this.column = column;

if (global.go) (<any>this).stack = (new Error()).stack;
	}

	static fromError(err:Error,template:string,line:number,column:number)
	{
//TODO copy stack trace over?	
		return new TemplateError(err.toString(),template,line,column);
	}
}

