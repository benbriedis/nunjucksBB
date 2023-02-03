//const webpack = require('webpack');
const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 
module.exports = env => merge(common(env), {
    mode: 'production',

	plugins: [
        new BundleAnalyzerPlugin({analyzerMode:'static'}),
	],
/*
    optimization: {
        splitChunks: { 
            chunks: 'all'
        }
    }
*/

//    stats: 'verbose'
});
