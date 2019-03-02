/**
 * A plugin to identify inputs with no visual indication of focus
 */
let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("no-focus");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
        let hasFocusBorder = false;
        for (let side of ["left", "right", "top", "bottom"]) {
            hasFocusBorder = hasFocusBorder
                || focusStyle[`border-${side}-style`] !== "none" &&
                     parseFloat(focusStyle[`border-${side}-width`]) !== "0";
        }

        let borderDiff = false;
        for (let side of ["left", "right", "top", "bottom"]) {
            borderDiff = borderDiff
                || (style[`border-${side}-style`] !== focusStyle[`border-${side}-style`])
                || (style[`border-${side}-width`] !== focusStyle[`border-${side}-width`])
                || (style[`border-${side}-color`] !== focusStyle[`border-${side}-color`]);
        }

        return borderDiff && hasFocusBorder;
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

        let focusable = [];
        let index = 0;

        $("*").each((i, el) => {
            if ($(el).parents(".tota11y").length) {
                return;
            }

            // Ignore elements we can't focus
            if (!el.hasAttribute("tabIndex") &&
                    !axs.utils.isElementImplicitlyFocusable(el)) {
                return;
            }

            // Ignore invisible elements
            if (axs.utils.elementIsTransparent(el) ||
                axs.utils.elementHasZeroArea(el)) {
                    return;
            }

            focusable.push(el);
        });

        focusable.forEach((el) => {
            // We assume none of these elements are already focused
            let style = deserialize(serialize(getComputedStyle(el)));

            let $el = $(el);
            console.log("Adding listener to focus");
            $el.on("focus", function testFocus() {
                console.log("Testing focus");
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

                $el.off("focus", testFocus);

                focusNext();
            });
        });

        function focusNext() {
            if ((focusable.length > 0) && (index < focusable.length)) {
                let el = focusable[index];
                console.log(`Focusing ${index}th element: ${el}`);
                index += 1;
                el.focus({
                    preventScroll: true,
                });
                sleep(1000).then(() => {
                    if (el === document.activeElement) {
                        console.log(`Skipping ${index}th element`);
                        index += 1;
                        focusNext();
                    }
                });
            }
        }
        focusNext();

        activeElement && activeElement.focus();
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = FocusStylesPlugin;
