/**
 * A plugin to identify inputs with no visual indication of focus
 */
let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("no-focus");

function deserialize(style) {
    return JSON.parse(style);
}

function serialize(style) {
    let o = {};
    // Create an object and convert fields/values so the
    // fields index by property name rather than 0,1,2,3
    // so when we serialise by JSON the interface stays the same
    // as when we index an actual CSSStyleDeclaration object.
    for (let i = 0; i < style.length; i++) {
        o[style.item(i)] = style.getPropertyValue(style.item(i));
    }
    return JSON.stringify(o);
}

// An array of style attributes which provide a visual indication of
// focus when changed
const VISUAL_INDICATORS = [
    function outline(style, focusStyle) {
        let hasFocusOutline = focusStyle["outline-style"] !== "none" &&
            parseFloat(focusStyle["outline-width"]) !== "0";

        let outlineDiff = false
            || (style["outline-style"] !== focusStyle["outline-style"])
            || (style["outline-width"] !== focusStyle["outline-width"])
            || (style["outline-color"] !== focusStyle["outline-color"]);

        return outlineDiff && hasFocusOutline;
    },

    function border(style, focusStyle) {
        // let hasFocusBorder = focusStyle["border-style"] !== "none" &&
        //     parseFloat(focusStyle["border-width"]) !== "0";

        let borderDiff = false;
        for (let side of ["left", "right", "top", "bottom"]) {
            borderDiff = borderDiff
                || (style[`border-${side}-style`] !== focusStyle[`border-${side}-style`])
                || (style[`border-${side}-width`] !== focusStyle[`border-${side}-width`])
                || (style[`border-${side}-color`] !== focusStyle[`border-${side}-color`]);
        }

        console.log(`Border diff: ${borderDiff}`);

        return borderDiff; // && hasFocusBorder;
    },

    function textDecoration(style, focusStyle) {
        return style["text-decoration"] !== focusStyle["text-decoration"];
    }
];

class FocusStylesPlugin extends Plugin {
    getName() {
        return "focus";
    }

    getTitle() {
        return "Focus styles";
    }

    getDescription() {
        return "Highlights input elements which have no focus style";
    }

    getAnnotate() {
        return annotate;
    }

    run() {
        let activeElement = document.activeElement;

        $("*").each((i, el) => {
            if ($(el).parents(".tota11y").length) {
                return;
            }

            if (!el.hasAttribute("tabIndex") &&
                    !axs.utils.isElementImplicitlyFocusable(el)) {
                return;
            }

            let style = deserialize(serialize(getComputedStyle(el)));
            el.focus();
            let focusStyle = deserialize(serialize(getComputedStyle(el)));

            let passes = false;
            VISUAL_INDICATORS.forEach((test) => {
                if (passes) return;

                if (test(style, focusStyle)) {
                    passes = true;
                }
            });

            if (!passes) {
                annotate.errorLabel($(el), "Um", "idk");
            }
        });

        activeElement && activeElement.focus();
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = FocusStylesPlugin;
