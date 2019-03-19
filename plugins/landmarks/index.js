/**
 * A plugin to label all ARIA landmark roles
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("landmarks");

let aboutTemplate = require("./about.handlebars");

class LandmarksPlugin extends Plugin {
    getName() {
        return "landmarks";
    }

    getTitle() {
        return "Landmarks";
    }

    getDescription() {
        return "Labels all ARIA landmarks";
    }

    getAnnotate() {
        return annotate;
    }

    run() {
        let seen = new Set();

        $("[role]:not(.tota11y-toolbar,.tota11y-plugin)").each(function() {
            annotate.label($(this), $(this).attr("role"));
            seen.add(this);
        });

        $(`aside:not(.tota11y-toolbar,.tota11y-plugin),
            footer:not(.tota11y-toolbar,.tota11y-plugin),
            form:not(.tota11y-toolbar,.tota11y-plugin),
            header:not(.tota11y-toolbar,.tota11y-plugin),
            main:not(.tota11y-toolbar,.tota11y-plugin),
            nav:not(.tota11y-toolbar,.tota11y-plugin),
            section:not(.tota11y-toolbar,.tota11y-plugin)`).each(
                function() {
            if (!seen.has(this)) {
                // don't label HTML5 sectioning element if element has a role
                annotate.label(
                    $(this),
                    `&lt;${$(this).prop("tagName").toLowerCase()}&gt;`);
            }
        });

        this.about($(aboutTemplate()));
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = LandmarksPlugin;
