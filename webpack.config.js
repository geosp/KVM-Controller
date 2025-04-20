const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const { sourceMapsEnabled } = require('process');

const commonConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // emit source-maps for debugging
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    // ensure source-map references point to absolute paths
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
  },
};

const mainConfig = {
  ...commonConfig,
  target: 'electron-main',
  externalsPresets: { electron: true },
  externals: [
    nodeExternals(),
    { '@serialport/bindings-cpp': 'commonjs2 @serialport/bindings-cpp' }
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    'electron/main': './electron/main.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
};

const preloadConfig = {
  ...commonConfig,
  target: 'electron-preload',
  entry: {
    'electron/preload': './electron/preload.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
};

const rendererConfig = {
  ...commonConfig,
  target: 'web',
  entry: {
    'src/index': './src/index.tsx',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,
  },
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
