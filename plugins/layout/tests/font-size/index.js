let $ = require("jquery");
let annotate = require("../../../shared/annotate")("layout");
let LayoutTest = require("../base");

class FontSizeLayoutTest extends LayoutTest {
    constructor() {
        super();
        this.preservedFontSizes = [];
    }

    apply() {
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
        });
    }

    detect() {
        this.preservedFontSizes.forEach((entry) => {
            if ((!entry.overflow.x && this.isOverflow(entry.$el).x)
                    || (!entry.overflow.y && this.isOverflow(entry.$el).y)) {
                // resizing has caused overflow that wasn't present before
                entry.error = () => {
                    annotate.errorLabel(entry.$el, "", "Overflows at 200%");
                };
            }
        });
    }

    cleanup() {
        // Set all elements to original size
        this.preservedFontSizes.forEach((entry) => {
            entry.$el.css("font-size", `${entry.pxFontSize}px`) ;
        });
    }

    report() {
        this.preservedFontSizes.forEach((entry) => {
            if (entry.error) {
                entry.error();
            }
        });
    }

    isOverflow($el) {
        // identify if the element is overflowing,
        // ie the width of all its content is more than the width
        // of its visible content
        return {
            x: $el[0].scrollWidth > $el.innerWidth(),
            y: $el[0].scrollHeight > $el.innerHeight(),
        }
    }
}

module.exports = FontSizeLayoutTest;
