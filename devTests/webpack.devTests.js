const path = require('path');
const webpack = require('webpack');

module.exports = env => {
    return {
		mode: 'development',
        entry: {
            browserPrecompiledTest: {
				import: './devTests/BrowserPrecompiledTest.ts',
				filename: '../dist/devTests/BrowserPrecompiledTest.js',
			},
        },
		resolve: {
			extensions: ['.ts','.js'],
			fallback: {
				nunjucksBB:false
    		}
		},
		module: {
			rules: [{
//XXX does this need to be restricted?			
				test: /\.ts$/,

				use: {
					loader: 'ts-loader',
					options: {
						configFile: 'devTests/tsconfig.browser.json'
					}
				},
			}]
		},
    };
};
