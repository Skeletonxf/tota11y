/**
 * An index of plugins.
 *
 * Exposes an array of plugin instances.
 */

let A11yTextWand = require("./a11y-text-wand");
let A11yName = require("./a11y-name");
let AltTextPlugin = require("./alt-text");
let ContrastPlugin = require("./contrast");
let HeadingsPlugin = require("./headings");
let LabelsPlugin = require("./labels");
let LandmarksPlugin = require("./landmarks");
let LinkTextPlugin = require("./link-text");
let TablesPlugin = require("./tables");

module.exports = {
    default: [
        new HeadingsPlugin(),
        new ContrastPlugin(),
        new LinkTextPlugin(),
        new LabelsPlugin(),
        new AltTextPlugin(),
        new LandmarksPlugin(),
        new TablesPlugin(),
    ],

    experimental: [
        new A11yTextWand(),
        new A11yName(),
    ],
};
