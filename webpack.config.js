var webpack = require("webpack");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: "build",
    filename: "bundle.js"
  },
  devServer: {
    inline: true,
    contentBase: "./",
    port: 8080
  },
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: "style-loader!css-loader!sass-loader",
      }
    ]
  }
}
