let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("a11y-name");
let audit = require("../shared/audit");

let errorTemplate = require("./error-template.handlebars");
let aboutTemplate = require("./about.handlebars");

require("./style.less");

class A11yName extends Plugin {
    getName() {
        return "a11y-name";
    }

    getTitle() {
        return "Accessible names";
    }

    getDescription() {
        return "Checks visible label text is included in programmatic labels";
    }

    getAnnotate() {
        return annotate;
    }

    run() {
        $("a, input, textarea, select, button").each((i, el) => {
            // elementIsHtmlControl

            let $el = $(el);

            // Ignore elements that are part of the tota11y UI
            if ($el.parents(".tota11y").length > 0) {
                return;
            }

            // Ignore invisible elements
            if (axs.utils.elementIsTransparent(el) ||
                axs.utils.elementHasZeroArea(el)) {
                    return;
            }

            // Ignore elements positioned off screen
            {
              let viewportRect = el.getBoundingClientRect();

              // apply the current scrolling to the bounding rectangle
              // so the values are relative to the document rather
              // than the viewport
              let rect = {
                top: viewportRect.top + window.scrollY,
                left: viewportRect.left + window.scrollX,
                right: viewportRect.right + window.scrollX,
                bottom: viewportRect.bottom + window.scrollY,
              }

              let documentWidth = $(document).width();
              let documentHeight = $(document).height();

              if ((rect.left < 0 || rect.right > documentWidth)
                      && (rect.top < 0 || rect.bottom > documentHeight)) {
                  return;
              }
            }

            // Ignore elements that have been hidden by CSS
            if (($el.css("overflow") === "hidden")
                    && ($el.width() <= 1 && $el.height() <= 1)) {
                return;
            }

            let alts = {};
            let extractedText = axs.properties.findTextAlternatives(
                el, alts);

            if (extractedText === null) {
                return;
            }

            const unmodifiedExtractedText = extractedText.split("").join("");

            // get the texts in the element or children of the element
            let visibleText = [];

            // add any label text
            if (el.id) {
                visibleText.push($(`label[for=${el.id}]`).text());
            }

            if (["a", "button"].some(
                    t => t === $el.prop("tagName").toLowerCase())) {
                // Need to use #text() on a and button elements
                visibleText.push($el.text());
            } else {
                // Need to use #val() instead of #text() on
                // inputs, textarea and select elements
                visibleText.push($el.val());
            }

            const unmodfiedVisibleText = visibleText
                .reduce((a, t) => a + t + " & ", "")
                .slice(0, -3);

            // strip all punctuation and casing from both texts
            visibleText = visibleText.map(
                t => t
                    .replace(/[\s'!#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~]/g, "")
                    .toLowerCase()
            );
            extractedText = extractedText
                .replace(/[\s'!#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~]/g, "")
                .toLowerCase();

            visibleText = visibleText.filter(t => t !== "");

            if (visibleText.length === 0) {
                return;
            }

            if (extractedText === "") {
                return;
            }

            let labelInName = visibleText.some(t => extractedText.includes(t));

            // also check for the extracted text including only most of
            // the visible text to accomodate for prepended and appended
            // 'text' content that is converted to visual forms (ie arrows)
            if (!labelInName) {
                for (let text of visibleText) {
                    for (let i = 0;
                            ((i < text.length * 0.25) && !labelInName);
                            i++) {
                        let j = i + text.length * 0.75 - 1;
                        let partialVisibleText = text.substring(i, j);
                        if (partialVisibleText.length > 0 &&
                                extractedText.includes(partialVisibleText)) {
                            labelInName = true;
                        }
                    }
                }
            }

            if (labelInName) {
                annotate
                    .label($el, unmodifiedExtractedText)
                    .addClass("tota11y-label-success");
            } else {
                let title = "Visual & programmatic labels do not match";

                let entry = this.error(
                    title,
                    $(errorTemplate({
                        extractedText: unmodifiedExtractedText,
                        visibleText: unmodfiedVisibleText,
                        elementName: $el.prop("tagName").toLowerCase(),
                    })),
                    $el);

                annotate.errorLabel($el, "", title, entry);
            }
        });

        this.about($(aboutTemplate()));
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = A11yName;
