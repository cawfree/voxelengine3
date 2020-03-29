const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vox/i,
        use: 'arraybuffer-loader',
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: 'file-loader',
      },
      {
        test: /\.mp3/i,
        use: 'file-loader',
      },
    ],
  },
  optimization: {
    minimize: false,
  },
};
