let $ = require("jquery");
let Setting = require("../base");

const STYLE_CLASS = "tota11y-setting-translucentAnnotations";

class TranslucentAnnotations extends Setting {
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
            `<style class="${STYLE_CLASS}"
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
        $(`.${STYLE_CLASS}`).remove();
        this.$style = null;
    }
}

module.exports = TranslucentAnnotations;
