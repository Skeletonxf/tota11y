let $ = require("jquery");
let annotate = require("../../../shared/annotate")("layout");
let LayoutTest = require("../base");

let errorTemplate = require("./error-template.handlebars");

class FontSizeLayoutTest extends LayoutTest {
    constructor() {
        super();
        this.textElements = [];
        this.applied = false;
        this.$checkboxes = [];
    }

    apply() {
        this.$checkboxes.forEach(c => c.prop("checked", true));
        if (this.applied) {
            return;
        }

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

            // Save original font size so it can be restored on cleanup.
            this.textElements.push({
                $el: $el,
                pxFontSize: pxFontSize,
                hasInlineFontSize: !!el.style.fontSize,
                overflow: this.isOverflow($el),
            });
        });

        // Apply font size changes after querying the computed font size
        // of all elements to ignore these values changing as we resize elements
        this.textElements.forEach((entry) => {
            entry.$el.css("font-size", `${entry.pxFontSize * 2}px`);
        });

        this.applied = true;
    }

    reportError($el, overflows, infoPanel) {
        let $description = $(errorTemplate({
            overflowX: overflows.x,
            overflowY: overflows.y,
        }));
        let entry = infoPanel.addError(
            "Overflows at 200% font size",
            $description,
            $el
        );
        let $checkbox = $description.find(".preview-font-size");
        $checkbox.click((e) => {
            if ($(e.target).prop("checked")) {
                this.apply();
            } else {
                this.cleanup();
            }
            annotate.refreshAll();
        });
        this.$checkboxes.push($checkbox);
        annotate.errorLabel(entry.$el, "", "Overflows at 200%", entry);
    }

    detect() {
        this.textElements.forEach((entry) => {
            let overflow = this.isOverflow(entry.$el);
            if ((!entry.overflow.x && overflow.x)
                    || (!entry.overflow.y && overflow.y)) {
                // resizing has caused overflow that wasn't present before
                entry.error = (infoPanel) => {
                    this.reportError(
                        entry.$el,
                        overflow,
                        infoPanel
                    );
                };
            }
        });
    }

    cleanup() {
        this.$checkboxes.forEach(c => c.prop("checked", false));
        if (!this.applied) {
            return;
        }

        // Set all elements to original size
        this.textElements.forEach((entry) => {
            // Remove the inline style we added unless the inline style
            // we added overrided an existing inline style in which case
            // apply it again.
            if (entry.hasInlineFontSize) {
                entry.$el.css("font-size", `${entry.pxFontSize}px`) ;
            } else {
                entry.$el.css("font-size", "");
            }
        });

        this.applied = false;
    }

    report(infoPanel) {
        this.textElements.forEach((entry) => {
            if (entry.error) {
                entry.error(infoPanel);
            }
        });
    }

    getPreviewClass() {
        return "preview-font-size";
    }

    isOverflow($el) {
        let el = $el[0];
        let style = window.getComputedStyle(el);
        // Filter overflow detection to only for elements that will
        // be visually cut off if they overflow, as otherwise most of
        // the overflowing and still visible elements are not actually
        // any problems and create a lot of noise.
        let cutsOff = {
            x: style.getPropertyValue("overflow-x") === "hidden",
            y: style.getPropertyValue("overflow-y") === "hidden",
        }
        // Allow a 20% threshold of 'overflow' as otherwise
        // the false positive rate is very high with many elements in visual
        // terms not cut off at all.
        let overflow = {
            x: el.scrollWidth > el.offsetWidth * 1.2,
            y: el.scrollHeight > el.offsetHeight * 1.2,
        }
        return {
            x: cutsOff.x && overflow.x,
            y: cutsOff.y && overflow.y,
        }
    }
}

module.exports = FontSizeLayoutTest;
