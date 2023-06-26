const path = require('path');
const webpack = require('webpack');

module.exports = env => {
    return {
        entry: {
            browserPrecompiledTest: {
				import: './devTests/BrowserPrecompiledTest.ts',
				filename: './dist/devTests/BrowserPrecompiledTest.js',
			},
/*			
			output: {
				filename: 'BrowserPrecompiledTest.js',
				path: 'dist',
				publicPath: '/',
			},
*/			
        },
		resolve: {
			alias: {
				nunjucksBB: path.resolve(__dirname,'node_modules/nunjucksBB/dist/nunjucks-slim.js')
			},
			extensions: ['.ts','.js']
		},
//		main: 'dist/nunjucks.js',
		module: {
			rules: [{
//XXX does this need to be restricted?			
				test: /\.ts$/,

				use: {
					loader: 'ts-loader',
					options: {
						configFile: 'devTests/tsconfig.devTests.json'
					}
				},
			}]
		},
    };
};
