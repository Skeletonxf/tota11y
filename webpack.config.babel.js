let fs = require("fs");
let handlebars = require("handlebars");
let path = require("path");
let postcss = require("postcss");
let webpack = require("webpack");
let autoprefixer = require("autoprefixer");

let options = require("./utils/options");
const FileManagerPlugin = require('filemanager-webpack-plugin');

// PostCSS plugin to append !important to every CSS rule
let veryimportant = postcss.plugin("veryimportant", function() {
    return function(css) {
        css.walkDecls(function(decl) {
            decl.important = true;
        });
    };
});

let bannerTemplate = handlebars.compile(
    fs.readFileSync("./templates/banner.handlebars", "utf-8"));

const plugins = [
    // Add a banner to our bundles with a version number and license info
    new webpack.BannerPlugin({
          banner: bannerTemplate({
              version: require("./package.json").version,
          }),
          entryOnly: true
        }),

    // Make the JSX pragma function available everywhere without the need
    // to use "require"
    new webpack.ProvidePlugin({
        [options.pragma]: path.join(__dirname, "utils", "element"),
    }),
    // WebExtensions do not accept symlinking so copy
    // everything built into the web extension folder
    new FileManagerPlugin({
      // copy after building
        onEnd: {
            copy: [
                {
                    source: "./build/tota11y.js",
                    destination: "./addon/build/",
                },
                {
                    source: "./build/sidebar.js",
                    destination: "./addon/build/",
                },
            ],
        },
    }),
];

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        "tota11y": "./index.js",
        sidebar: "./addon/sidebar/index.js",
    },
    mode: (process.env.NODE_ENV === "production") ? "production" : "development",
    output: {
        path: path.join(__dirname, "build"),
        filename: "[name].min.js",
    },
    module: {
        rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
            },
            {
              test: /\.handlebars$/,
              loader: "handlebars-loader",
            },
            {
              test: /\.less$/,
              use: [
                "style-loader",
                "css-loader",
                {
                  loader: "postcss-loader",
                  options: {
                    ident: "postcss",
                    plugins: [
                      veryimportant,
                      autoprefixer({browsers: ["> 1%"]}),
                    ],
                  },
                },
                "less-loader",
              ],
            },
        ],
    },
    plugins,
    optimization: {
        minimizer: [
            // Suppress uglifyJS warnings from node_modules/
            new UglifyJsPlugin({
                uglifyOptions: {
                    compress: false,
                },
            })
        ]
    },
    performance: {
        // ignore asset size limit warnings which are irrelevant for
        // WebExtensions
        hints: false,
    },
};
