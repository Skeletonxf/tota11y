let $ = require("jquery");
let Plugin = require("../base");

class TranslucentAnnotations extends Plugin {
    getName() {
        return "translucent-annotations";
    }

    getDescription() {
        return "Translucent annotations";
    }

    applyToSidebar() {
        return false;
    }

    applyToPage() {
        return true;
    }

    enable() {
        this.$style = $(
            `<style id="tota11y-setting-translucentAnnotations"
                    type="text/css">
                .tota11y-label {
                    opacity: 0.6;
                }
                .tota11y-label:hover {
                    opacity: 0.9;
                }
            </style>`
        );
        this.$style.appendTo($("head"));
    }

    disable() {
        this.$style.remove();
        this.$style = null;
    }
}

module.exports = TranslucentAnnotations;
