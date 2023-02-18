
export class AssertError extends Error
{
	constructor(message?:string)
	{
		let msg = 'Assertion check failed'
		if (message!=null)
			msg += ': '+message;
		super(msg);
	}
}

export default class Assert
{
	public static check(condition:boolean,message?:string): asserts condition
	{
		if (!condition) 
			throw new AssertError(message);
	}

	/* The to*() functions asset not null and not undefined */
	public static have<T>(value:T): NonNullable<T>
	{
		this.exists<T>(value);
		return value;
	}

	public static exists<T>(obj: T): asserts obj is NonNullable<T>
	{
		this.check(obj!=null,'Object does not exist');
	}

	public static toString(value:any):string
	{
		if (typeof value !== 'string') 
			throw new AssertError('Not a string');
		return value;
	}

	public static toNumber(value:any):number
	{
		if (typeof value !== 'number') 
			throw new AssertError('Not a number');
		return value;
	}
}

