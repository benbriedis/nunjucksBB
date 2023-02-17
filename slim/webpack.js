const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = env => {
    return {
        entry: {
            nunjucks: './slim.ts'
        },
    	mode: 'production',
        output: {
			filename: 'nunjucks-slim.js',
            path: path.resolve(__dirname, '../dist/slim'),
            publicPath: '/',
			globalObject: 'this',
			library: {
				name: 'nunjucksBB',
				type: 'umd'
			}
        },
		devtool: 'source-map',
/*		
		optimization: {
			moduleIds: 'deterministic',
			runtimeChunk: 'single',
			splitChunks: {
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
					},
				},
			}
		},
*/		
		module: {
			rules: [{
				test: /\.ts$/,
				use: {
					loader: 'ts-loader',
					options: {
						//XXX without this option MIGHT be possible to share compiled code
						//  between server and client. Includes and excudes come from tsconfig.json.
						//  Having troble excluding vos/node_modules
	 					//onlyCompileBundledFiles: true,
						configFile: 'slimBuild/tsconfig.json'
					}
				}
			}]
		},
		resolve: {
			extensions: ['.ts'],
			plugins: [new TsconfigPathsPlugin({
				configFile: './tsconfig.json'
			})]
		}
    };
};
