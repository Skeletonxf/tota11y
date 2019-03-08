/**
 * An index of plugins.
 *
 * Exposes an array of plugin instances.
 */

let A11yTextWand = require("./a11y-text-wand");
let A11yName = require("./a11y-name");
let AltTextPlugin = require("./alt-text");
let ContrastPlugin = require("./contrast");
let DocumentPlugin = require("./document");
let FormsPlugin = require("./forms");
let HeadingsPlugin = require("./headings");
let LandmarksPlugin = require("./landmarks");
let LayoutPlugin = require("./layout");
let LinkTextPlugin = require("./link-text");
let NavigationPlugin = require("./navigation");
let TablesPlugin = require("./tables");

module.exports = {
    default: [
        new HeadingsPlugin(),
        new ContrastPlugin(),
        new LinkTextPlugin(),
        new FormsPlugin(),
        new AltTextPlugin(),
        new NavigationPlugin(),
        new LandmarksPlugin(),
        new TablesPlugin(),
        new LayoutPlugin(),
        new A11yName(),
        new DocumentPlugin(),
    ],

    experimental: [
        new A11yTextWand(),
    ],
};
