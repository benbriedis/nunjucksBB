const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

/*
module.exports = env => { 
	let xxx = merge(common(env), {
    	mode: 'development',
	});

console.log('MERGED:',xxx);	
	return xxx;
};	
*/

module.exports = env => merge(common(env), {
    mode: 'development',
/*	
	output: {
		globalObject: 'this',	
	}
*/

	/* 
 		See this for potential speedups to incremental builds. Currently not a problem.
			https://webpack.js.org/guides/build-performance/#incremental-builds
		Thre are faster options than Webpack these days too
	*/
});
