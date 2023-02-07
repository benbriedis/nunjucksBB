import expect from 'expect.js';

import nunjucks from '../src/index.js';
import Environment from '../src/environment.js';
import Template from '../src/template.js';

//TODO remove nunjucksFull
const nunjucksFull = nunjucks;


export async function equal(str,ctx=undefined,opts=undefined,str2=undefined,env=undefined) 
{
	if (typeof ctx === 'string') {
		env = opts;
		str2 = ctx;
		ctx = null;
		opts = {};
	}
	if (typeof opts === 'string') {
		env = str2;
		str2 = opts;
		opts = {};
	}
	opts = opts || {};
	var res = await render(str,ctx,opts,env);
	expect(res).to.be(str2);
}

export async function jinjaEqual(str,ctx,str2,env) 
{
	var jinjaUninstalls = [nunjucks.installJinjaCompat()];
	if (nunjucksFull !== nunjucks) 
		jinjaUninstalls.push(nunjucksFull.installJinjaCompat());
	try {
		return await equal(str,ctx,{},str2,env);
	} 
	finally {
		for (var i = 0; i < jinjaUninstalls.length; i++) 
			jinjaUninstalls[i]();
	}
}

export function normEOL(str) 
{
	if (!str) 
		return str;
	return str.replace(/\r\n|\r/g, '\n');
}

function randomTemplateName() 
{
	var rand = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
	return rand + '.njk';
}

// eslint-disable-next-line consistent-return
export async function render(str:string,ctx={},opts=undefined,env=undefined):Promise<string>
{
	if (typeof ctx === 'function') {
		ctx = null;
		opts = null;
		env = null;
	} else if (typeof opts === 'function') {
		opts = null;
		env = null;
	} else if (typeof env === 'function') 
		env = null;

	opts = opts || {};
	opts.dev = true;

	const loader = new nunjucks.FileSystemLoader('tests/templates');
	var e = env || new Environment(loader, opts);

	var name;
	if (opts.filters) 
		for (name in opts.filters) 
			if (Object.prototype.hasOwnProperty.call(opts.filters, name)) 
				e.addFilter(name, opts.filters[name]);

	if (opts.asyncFilters) 
		for (name in opts.asyncFilters) 
			if (Object.prototype.hasOwnProperty.call(opts.asyncFilters, name)) 
				e.addFilter(name, opts.asyncFilters[name], true);

	if (opts.extensions) 
		for (name in opts.extensions) 
			if (Object.prototype.hasOwnProperty.call(opts.extensions, name)) 
				e.addExtension(name, opts.extensions[name]);

	ctx = ctx || {};

	const t = new Template(str,e,null);

	return await t.render(ctx);
}

