var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
// var OpenBrowserPlugin = require('open-browser-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        build: './src/pages/index',
        vendor: ['react', 'react-dom']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle-[hash:8].js',
        publicPath: '/',
        chunkFilename: '[name]-[chunkhash:8].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: __dirname + '/index.html'
        }),
        // new OpenBrowserPlugin({ url: 'http://localhost:8080' }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'vendor-[hash:8].js',
            minChunks: function (module, count) {
                return module.resource && module.resource.indexOf(path.resolve(__dirname, 'src')) === -1;
            }
        }),
        new CleanWebpackPlugin(['dist'], {
            root: '',
            verbose: true,
            dry: false
        }),
        new BundleAnalyzerPlugin({
            reportFilename: 'report.html'
        }),
        // 输出独立样式文件，配置文件命名
        new ExtractTextPlugin('style-[hash:8].css', {
            allChunks: true
        })
    ],
    resolve: {
        // root: __dirname,
        alias: {
            shop: path.join(__dirname, './src/components')
        },
        modules: ["node_modules"],
        // modulesDirectories: ["web_modules", "node_modules", 'bower_components'],
        extensions: ['.js', '.jsx', '.less', '.css']
    },
    // devtool: 'eval-source-map',
    devServer: {
        disableHostCheck: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/,
                include: __dirname
            },
            /*{
                test: [
                    /component\.jsx$/,
                    /\.async\.jsx$/,
                    "/abs/path/to/component.jsx"
                ],
                use: "react-proxy-loader"
            },*/
            {
                test: /\.css?$/,
                use : [
                    'style-loader',
                    'css-loader'
                ],
                include: __dirname
            },
            {
                test: /\.less?$/,
                include: __dirname,
                // exclude: /baseStyles.*\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader?{"sourceMap":true}'
                ]
            },
            /*{
                test: /\.less?$/,
                include: /baseStyles.*\.less$/,
                exclude: /\*!/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader?{"sourceMap":true}')
            },*/
            {
                test: /\.(jpe?g|png|gif|svg)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10240,
                        name: '[name].[ext]?[hash]'
                    }
                }
            }
        ]
    }

    // postcss: function () {
    //     return [require('autoprefixer')({
    //         add      : true,
    //         remove   : true,
    //         browsers : ['last 2 versions']
    //     })];
    // }
};
