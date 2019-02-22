let $ = require("jquery");
let annotate = require("../../../shared/annotate")("layout");
let LayoutTest = require("../base");

class TextSpacingLayoutTest extends LayoutTest {
    constructor() {
        super();
        this.textElements = [];
    }

    apply() {
        this.textElements = [];
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

            // Save font sizes and original styles for use in applying
            // and reverting spacing styles.
            this.textElements.push({
                $el: $el,
                pxFontSize: pxFontSize,
                overflow: this.isOverflow($el),
                lineHeight: style.getPropertyValue("line-height"),
                letterSpacing: style.getPropertyValue("letter-spacing"),
                wordSpacing: style.getPropertyValue("word-spacing"),
            });
        });

        // Apply style changes after querying the computed font size
        // of all elements to ignore these values changing as we modify elements
        this.textElements.forEach((entry) => {
            entry.$el.css("line-height", `${entry.pxFontSize * 1.5}px`);
            entry.$el.css("letter-spacing", `${entry.pxFontSize * 0.12}px`);
            entry.$el.css("word-spacing", `${entry.pxFontSize * 0.16}px`);
            // TODO spacing following paragraphs to at least 2 times font size
        });
    }

    detect() {
        this.textElements.forEach((entry) => {
            if ((!entry.overflow.x && this.isOverflow(entry.$el).x)
                    || (!entry.overflow.y && this.isOverflow(entry.$el).y)) {
                // adjusting spacing has caused overflow that wasn't present
                // before
                entry.error = () => {
                    annotate.errorLabel(entry.$el, "", "Overflows with increased spacing");
                };
            }
        });
    }

    cleanup() {
        // Set all elements to original size
        this.textElements.forEach((entry) => {
            entry.$el.css("line-height", entry.lineHeight);
            entry.$el.css("letter-spacing", entry.letterSpacing);
            entry.$el.css("word-spacing", entry.wordSpacing);
        });
    }

    report() {
        this.textElements.forEach((entry) => {
            if (entry.error) {
                entry.error();
            }
        });
    }

    isOverflow($el) {
        // Many elements can harmlessly 'overflow' without being cut
        // off or rendered difficult to read. Restricting detection
        // to elements that don't allow scroll bars when overflowing
        // should reduce the noise in 'overflown' elements that are harmless
        let el = $el[0];
        let style = window.getComputedStyle(el);
        let scrollables = ["scroll", "auto"];
        let scrollable = {
            x: scrollables.some(s => s === style.getPropertyValue("overflow-x")),
            y: scrollables.some(s => s === style.getPropertyValue("overflow-y")),
        }
        let overflow = {
            x: el.scrollWidth > el.clientWidth,
            y: el.scrollHeight > el.clientHeight,
        }
        // FIXME the overflow should not be harmless as on most of
        // stackoverflow.com
        return {
            x: !scrollable.x && overflow.x,
            y: !scrollable.y && overflow.y,
        }
    }
}

module.exports = TextSpacingLayoutTest;
