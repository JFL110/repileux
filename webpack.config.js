const CompressionPlugin = require('compression-webpack-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

//
const homePageHtml = "home.html";

// Plugin to execute any code after compilation
const ArbitraryCodeAfterReload = function (cb) {
  this.apply = function (compiler) {
    if (compiler.hooks && compiler.hooks.done) {
      compiler.hooks.done.tap('webpack-arbitrary-code', cb);
    }
  };
};

const swapVersions = () => {
  console.log('Swapping versions')
  const homePage = './dist/' + homePageHtml;
  const content = fs.readFileSync(homePage, { encoding: 'utf8', flag: 'r' });
  fs.writeFileSync(homePage, content.replace("?v=x", "?v=" + new Date().getTime()))
};

module.exports = env => {

  // Common plugins
  const sharedPlugins = [ // Clean
    new CleanWebpackPlugin(),
    // Auto import react
    new webpack.ProvidePlugin({
      'React': 'react'
    })];

  // Common rules
  const sharedRules = [
    {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
      }
    }
  ];

  const isDemo = process.argv.some(arg => arg == '--demo');

  // NPM Package setup
  if (!isDemo) return ({
    entry: {
      lib: "./js/main/index.js",
    },
    output :{
      filename : "index.js",
      libraryTarget: 'umd',
    },
    plugins: [
      ...sharedPlugins
    ],
    module: {
      rules: [
        ...sharedRules
      ]
    },
    resolve: {
      extensions: ['.js', '.es6']
    },
  });


  // Demo setup
  if (isDemo) return ({
    entry: {
      demo: "./js/demo/index.js",
    },
    output: {
      filename: ({ chunk }) => "./static/" + chunk.name + ".bundle.js",
      // `chunkFilename` provides a template for naming code-split bundles (optional)
      chunkFilename: './static/[hash:8].[name].bundle.js',
      publicPath: "/"
    },
    watchOptions: {
      aggregateTimeout: 200,
      poll: 1000
    },
    devServer: {
      writeToDisk: true,
      historyApiFallback: {
        index: '/dist/' + homePageHtml
      }
    },
    plugins: [
      ...sharedPlugins,
      // Compression plugins
      env.NODE_ENV === 'production' && new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        minRatio: Number.MAX_SAFE_INTEGER,
        test: /\.js$|\.css$|\.html$/,
      }),
      env.NODE_ENV === 'production' && new BrotliPlugin({
        asset: '[path].br[query]',
        minRatio: Number.MAX_SAFE_INTEGER,
        test: /\.js$|\.css$|\.html$/,
      }),
      // Copy static content plugin
      new CopyPlugin({
        patterns: [
          // Copy everything except home page to static
          {
            from: './web',
            to: './static/',
            globOptions: {
              ignore: ['**/' + homePageHtml],
            },
          },
          // Copy homepage to static
          {
            from: './web/' + homePageHtml,
            to: './' + homePageHtml,
          },
        ],
      }),
      new ArbitraryCodeAfterReload(swapVersions),
    ].filter(Boolean),
    mode: "development",
    module: {
      rules: [
        // Image inline
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve('url-loader'),
          options: {
            limit: 10 * 1024,
            name: './static/[hash:8].[name].[ext]',
          }
        },
        // Image optimise - webp
        {
          test: /\.(webp.jpe?g)$/i,
          loader: 'image-webpack-loader',
          enforce: 'pre',
          options: {
            webp: {
              quality: 75
            }
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader', 'css-loader', 'sass-loader',
          ],
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        ...sharedRules
      ]
    },
    resolve: {
      extensions: ['.js', '.es6']
    },
  })
}