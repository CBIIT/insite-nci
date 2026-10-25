const { merge } = require('webpack-merge');
const common = require('./common');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const paths = require('./paths');

const publicUrl = '';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/index.html' },       // root -> index.html
        { from: /^\/portal/, to: '/portal.html' }, // /portal -> portal.html
      ],
    },
    compress: true,
    open: true,
    port: 7800,
    client: {
      overlay: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { sourceMap: true } },
          { loader: 'postcss-loader', options: { sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 10000, // Smaller threshold for faster reloads
      maxSize: 244000, // Keeps chunks under the warning threshold
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new HtmlWebpackPlugin({
      chunks: ["app"],
      filename: "index.html",
      template: paths.appHtml, // Environment-specific template
      inject: true,
    }),
    new HtmlWebpackPlugin({
      chunks: ["portal"],              // only include admin bundle
      filename: "portal.html",          // will output dist/admin.html
      template: paths.appPortal,       // another template (public/admin.html)
      inject: true,
    }),
  ],
});
