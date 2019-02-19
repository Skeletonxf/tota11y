let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("layout");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class LayoutPlugin extends Plugin {
    constructor() {
        super();
        // List of original font sizes for text elements
        // Used to restore original sizes in cleanup.
        this.preservedFontSizes = [];
    }

    getName() {
        return "layout";
    }

    getTitle() {
        return "Layout"
    }

    getDescription() {
        return `
            Checks the page layout is robust to user style sheets and other
            modifications
        `;
    }

    getAnnotate() {
        return annotate;
    }

    isOverflow($el) {
        // identify if the element is overflowing,
        // ie the width of all its content is more than the width
        // of its visible content
        return $el[0].scrollWidth > $el.innerWidth()
    }

    run() {
        // First apply a font size of 200%

        $("*").each((i, el) => {
            // Only check elements with a direct text descendant
            if (!axs.properties.hasDirectTextDescendant(el)) {
                return;
            }

            let $el = $(el);

            // Ignore elements that are part of the tota11y UI
            if ($el.parents(".tota11y").length > 0) {
                return;
            }

            // Get the resolved font size normalised to pixels using
            // getComputedStyle so the browser does CSS unit conversion
            // work for us, and also get the style specified on the
            // element in whatever CSS unit to restore the font size to
            let style = window.getComputedStyle(el);
            let pxFontSize = parseFloat(style.getPropertyValue("font-size"));

            // Save original font size so it can be restored on cleanup.
            this.preservedFontSizes.push({
                $el: $el,
                pxFontSize: pxFontSize,
                overflow: this.isOverflow($el),
            });
        });

        // Apply font size changes after querying the computed font size
        // of all elements to ignore these values changing as we resize elements
        this.preservedFontSizes.forEach((entry) => {
            entry.$el.css("font-size", `${entry.pxFontSize * 2}px`);

            if (!entry.overflow && this.isOverflow(entry.$el)) {
                // resizing has caused overflow that wasn't present before
                annotate.errorLabel(entry.$el, "", "Overflows at 200%");
            }
        });

        this.reset();
        sleep(1000).then(() => {
            annotate.refreshAll();
        })
    }

    reset() {
        // Set all elements to original size
        this.preservedFontSizes.forEach((entry) => {
            entry.$el.css("font-size", `${entry.pxFontSize}px`) ;
        });
    }

    cleanup() {
        this.reset();
        annotate.removeAll();
    }
}

module.exports = LayoutPlugin;
