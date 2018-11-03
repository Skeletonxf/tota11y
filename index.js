/**
 * The entry point for tota11y.
 *
 * Builds and mounts the toolbar.
 */

// Require the base tota11y styles right away so they can be overwritten
require("./less/tota11y.less");

let $ = require("jquery");

let plugins = require("./plugins");
let toolbar = require("./toolbar.js");

const Toolbar = toolbar.toolbar;

// Chrome Accessibility Developer Tools - required once as a global
require("script-loader!./node_modules/accessibility-developer-tools/dist/js/axs_testing.js");

$(function() {
    var bar = new Toolbar();

    console.log("Delegating toolbar");
    bar.delegate();

    console.log("appending toolbar to body");
    // TODO: Make this customizable
    bar.appendTo($("body"));
    console.log("done");
});
