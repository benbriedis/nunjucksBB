export {SafeString,markSafe,suppressValue} from './SafeString';
export {isArray,inOperator,keys} from './lib';


// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
export class Frame 
{
	variables;
	parent;
	topLevel:boolean = false;
	// if this is true, writes (set) should never propagate upwards past
	// this frame to its parent (though reads may).
	isolateWrites:boolean;


//	constructor(parent=undefined, isolateWrites:boolean=false) 
	constructor(parent=undefined, isolateWrites:boolean=undefined) 
	{
		this.parent = parent;
		this.variables = Object.create(null);
		this.isolateWrites = isolateWrites;
	}

	set(name:string, val, resolveUp:boolean=false) 
	{
		// Allow variables with dots by automatically creating the
		// nested structure
		var parts = name.split('.');
		var obj = this.variables;
		var frame = this;

		if (resolveUp) {
			if ((frame = this.resolve(parts[0], true))) {
				frame.set(name,val,false);
				return;
			}
		}

		for (let i = 0; i < parts.length - 1; i++) {
			const id = parts[i];

			if (!obj[id]) 
				obj[id] = {};
			obj = obj[id];
		}

		obj[parts[parts.length - 1]] = val;
	}

	get(name:string) 
	{
		var val = this.variables[name];
		if (val !== undefined) 
			return val;
		return null;
	}

	lookup(name:string) 
	{
		var p = this.parent;
		var val = this.variables[name];

		if (val !== undefined) 
			return val;
//XXX looks like it needs a 'resolveUp' here... 
//    is it being handled by 'set' instead? If so why look upwards here?
//
//XXX THINK WE SHOULD LOOK UP ALL PARENT FRAMES, BUT a new hierarch is created during macro creation...
		return p && p.lookup(name);
	}

	resolve(name:string,forWrite:boolean) 
	{
		var p = (forWrite && this.isolateWrites) ? undefined : this.parent;
		var val = this.variables[name];
		if (val !== undefined) 
			return this;
		return p && p.resolve(name);
	}

	push(isolateWrites:boolean) 
	{
		return new Frame(this, isolateWrites);
	}

	pop() 
	{
		return this.parent;
	}
}

export default Frame;
