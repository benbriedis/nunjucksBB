(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["devTests/brokenTop.njk"] = (function() {
async function root(env,context,frame,runtime) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
const t_1 = await (await env.getTemplate("devTests/brokenImport1.njk", false, "devTests/brokenTop.njk", false)
).getExported();
context.setVariable("inc", t_1);
output += "IN BROKEN TOP\n\n";

var t_2 = await env.getTemplate("devTests/brokenInclude.njk", true, "devTests/brokenTop.njk", false);

console.log('AAA t_1:', t_1);
output += await t_2.render(context.getVariables(),frame.push());

console.log('BBB t_1:', t_1);
output += "\n";


var qqq = await runtime.memberLookup((t_1),"brokenMacro1");

output += runtime.suppressValue((lineno = 7, colno = 19, await runtime.callWrap(qqq, "inc[\"brokenMacro1\"]",context,[])), env.opts.autoescape);
//output += runtime.suppressValue((lineno = 7, colno = 19, await runtime.callWrap(await runtime.memberLookup((t_1),"brokenMacro1"), "inc[\"brokenMacro1\"]",context,[])), env.opts.autoescape);


output += "\n";
if(parentTemplate)
return await parentTemplate.rootRenderFunc(env, context, frame, runtime);
else
return output;
} catch (e) {
  runtime.handleError(e,'"devTests/brokenTop.njk"',lineno,colno);
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["devTests/brokenImport1.njk"] = (function() {
async function root(env,context,frame,runtime) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
var macro_t_1 = runtime.makeMacro(
[], 
[], 
async function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_2 = "";t_2 += "\tIN BROKEN MACRO 1\n";
frame = callerFrame;
return new runtime.SafeString(t_2);
});
context.addExport("brokenMacro1");
context.setVariable("brokenMacro1", macro_t_1);
if(parentTemplate)
return await parentTemplate.rootRenderFunc(env, context, frame, runtime);
else
return output;
} catch (e) {
  runtime.handleError(e,'"devTests/brokenImport1.njk"',lineno,colno);
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["devTests/brokenImport2.njk"] = (function() {
async function root(env,context,frame,runtime) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
var macro_t_1 = runtime.makeMacro(
[], 
[], 
async function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_2 = "";t_2 += "\tIN BROKEN MACRO 2\n";
frame = callerFrame;
return new runtime.SafeString(t_2);
});
context.addExport("brokenMacro2");
context.setVariable("brokenMacro2", macro_t_1);
if(parentTemplate)
return await parentTemplate.rootRenderFunc(env, context, frame, runtime);
else
return output;
} catch (e) {
  runtime.handleError(e,'"devTests/brokenImport2.njk"',lineno,colno);
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["devTests/brokenInclude.njk"] = (function() {
async function root(env,context,frame,runtime) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
const t_1 = await (await env.getTemplate("devTests/brokenImport2.njk", false, "devTests/brokenInclude.njk", false)
).getExported();context.setVariable("inc2", t_1);
if(parentTemplate)
return await parentTemplate.rootRenderFunc(env, context, frame, runtime);
else
return output;
} catch (e) {
  runtime.handleError(e,'"devTests/brokenInclude.njk"',lineno,colno);
}
}
return {
root: root
};

})();
})();

