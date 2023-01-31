(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["nunjucks/dev/top.njk"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\nIN TOP <br>\n\na: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "a"), env.opts.autoescape);
output += " <br>\nb: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "b"), env.opts.autoescape);
output += " <br>\n\n";
frame = frame.push();
var t_3 = (lineno = 6, colno = 17, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "range"), "range", context, [1,5]));
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("i", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\ti: ";
output += runtime.suppressValue(t_4, env.opts.autoescape);
output += "  <br>\n\n";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("nunjucks/dev/middle.njk", false, "nunjucks/dev/top.njk", false, function(t_6,t_5) {
if(t_6) { cb(t_6); return; }
callback(null,t_5);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_8,t_7) {
if(t_8) { cb(t_8); return; }
callback(null,t_7);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "  <br>\n";
});
}
}
frame = frame.pop();
output += "\nEND OF TOP <br>\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

