const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    "./src/main.js"
  ],
  output: {
    path: __dirname+"/build/",
    publicPath: "/",
    filename: "bundle.js"
  },
  plugins: [new HtmlWebpackPlugin({
    template: "./src/index.html" // Copies src html as "template" to build
  }), new webpack.HotModuleReplacementPlugin()],
  devServer: {
    inline: true,
    contentBase: __dirname+"/build/",
    hot: true,
    port: 8080
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          "postcss-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  }
};
