const path = require('path');
const webpack = require('webpack');

module.exports = env => {
    return {
        entry: {
            nunjucks: './src/index.ts',
            browserTester: {
				dependOn: 'nunjucks',
				import: './devTests/BrowserTester.ts',
			}
        },

//TODO split into 'render' and 'compile + render' (ie slim and full)
//TODO use externals to trim out fs and commander?
//TODO add main or module?

//		main: 'dist/nunjucks.js',

        output: {
			filename: '[name].js',
//			filename: 'nunjucks.js',
//            path: path.resolve(__dirname, env.BUILDDIR),
            path: path.resolve(__dirname, 'dist'),
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
		resolve: {
/*		
			alias: {
				Common: '/var/www/vos/src/common',
				Browser: '/var/www/vos/src/browser',
				BrowserOnly: '/var/www/vos/src/browser'
				* Deliberately excluded server-side directories, e.g. Server, Deploy *
			},
*/			
			extensions: ['.ts','.js'],
			fallback: {
//XXX would be nice to separate out the server-specific code
				'fs':false,
				'path':false,
				'stream':false,
				'os':false,
				'fsevents':false
    		}
		},
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
						configFile: 'tsconfig.browser.json'
					}
				},
			}]
		},
       plugins: [

//XXX Maybe add WorkboxPlugin to improve offline use. See "Progressive Web Application in Webpack 

       ]
    };
};
