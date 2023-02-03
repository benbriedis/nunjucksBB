const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

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
		Also, there is Snowpack, but a fair bit of work to transfer to it I think.
	*/
});
