const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const extractCss = new MiniCssExtractPlugin({
    filename: 'main.css',
    chunkFilename: '[id].css',
});

module.exports = {
    mode: process.env.NODE_ENV,
    entry: './src/assets-app/index.tsx',
    output: {
        filename: 'app.js',
        path: path.join(__dirname, './dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre',
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                noEmit: false,
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
    },
    devServer: {
        index: path.join(__dirname, './src/assets-app/index.html'),
        port: 3000,
    },
    plugins: [extractCss],
};
