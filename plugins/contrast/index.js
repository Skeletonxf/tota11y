/**
 * A plugin to label different levels of contrast on the page, and highlight
 * those with poor contrast while suggesting alternatives.
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("contrast");

let titleTemplate = require("./error-title.handlebars");
let descriptionTemplate = require("./error-description.handlebars");
let aboutTemplate = require("./about.handlebars");

require("./style.less");

class ContrastPlugin extends Plugin {
    constructor() {
        super();
        // List of original colors for elements with insufficient contrast.
        // Used to restore original colors in cleanup.
        this.preservedColors = [];
    }

    getName() {
        return "contrast";
    }

    getTitle() {
        return "Contrast";
    }

    getDescription() {
        return "Labels elements with insufficient contrast";
    }

    getAnnotate() {
        return annotate;
    }

    addError({style, fgColor, bgColor, contrastRatio, requiredRatio}, el) {
        // Suggest colors at an "AA" level
        let suggestedColors = axs.color.suggestColors(
            bgColor,
            fgColor,
            { AA: requiredRatio }).AA;

        let templateData = {
            fgColorHex: axs.color.colorToString(fgColor),
            bgColorHex: axs.color.colorToString(bgColor),
            contrastRatio: contrastRatio,
            requiredRatio: requiredRatio,
            suggestedFgColorHex: suggestedColors.fg,
            suggestedBgColorHex: suggestedColors.bg,
            suggestedColorsRatio: suggestedColors.contrast
        };

        // Add click handler to preview checkbox
        let $description = $(descriptionTemplate(templateData));
        let originalFgColor = style.color;
        let originalBgColor = style.backgroundColor;

        $description.find(".preview-contrast-fix").click((e) => {
            if ($(e.target).prop("checked")) {
                // Set suggested colors
                $(el).css("color", suggestedColors.fg);
                $(el).css("background-color", suggestedColors.bg);
            } else {
                // Set original colors
                $(el).css("color", originalFgColor);
                $(el).css("background-color", originalBgColor);
            }
        });

        return this.error(
            titleTemplate(templateData),
            $description,
            $(el));
    }

    ptSize(style) {
        // Get the resolved value of the font size which lets
        // the browser do the work of converting em, rem, %, ect into px
        // values for us. We need the pt size as this is specified by
        // the WCAG so we use their recommended conversion factor of 1.333
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
        // https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
        return parseFloat(style.getPropertyValue("font-size")) / 1.333;
    }

    run() {
        // A map of fg/bg color pairs that we have already seen to the error
        // entry currently present in the info panel
        let combinations = {};

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

            let style = window.getComputedStyle(el);
            let bgColor = axs.utils.getBgColor(style, el);
            let fgColor = axs.utils.getFgColor(style, el, bgColor);
            let contrastRatio = axs.color.calculateContrastRatio(
                fgColor, bgColor).toFixed(2);

            // Calculate required ratio based on size according to WCAG
            // guidelines, bold lowers pt size needed to count as large text
            // https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
            let largeFont = (this.ptSize(style) >= 18) ||
                    (style.fontWeight === "bold" && this.ptSize(style) >= 14);
            let requiredRatio = largeFont ? 3.0 : 4.5;

            // Build a key for our `combinations` map and report the color
            // if we have not seen it yet
            let key = axs.color.colorToString(fgColor) + "/" +
                        axs.color.colorToString(bgColor) + "/" +
                        requiredRatio;

            if (contrastRatio >= requiredRatio) {
                // For acceptable contrast values, we don't show ratios if
                // they have been presented already
                if (!combinations[key]) {
                    annotate
                        .label($(el), contrastRatio)
                        .addClass("tota11y-label-success");

                    // Add the key to the combinations map. We don't have an
                    // error to associate it with, so we'll just give it the
                    // value of `true`.
                    combinations[key] = true;
                }
            } else {
                if (!combinations[key]) {
                    // We do not show duplicates in the errors panel
                    // to keep the output from being overwhelming
                    let error = this.addError({
                        style,
                        fgColor,
                        bgColor,
                        contrastRatio,
                        requiredRatio,
                    }, el);

                    // Save original color so it can be restored on cleanup.
                    this.preservedColors.push({
                        $el: $el,
                        fg: style.color,
                        bg: style.backgroundColor,
                    });

                    combinations[key] = error;
                }

                // We display errors multiple times for emphasis. Each error
                // will point back to the entry in the info panel for that
                // particular color combination.
                //
                // TODO: The error entry in the info panel will only highlight
                // the first element with that color combination
                annotate.errorLabel(
                    $el,
                    `
                    ${contrastRatio}
                    <span class="tota11y-swatches">
                        <span class="tota11y-swatch" style="background-color: ${axs.color.colorToString(fgColor)} !important"></span>
                        /
                        <span class="tota11y-swatch" style="background-color: ${axs.color.colorToString(bgColor)} !important"></span>
                    </span>
                    `,
                    "This contrast is insufficient at this size.",
                    combinations[key]);
            }
        });

        this.about($(aboutTemplate()));
    }

    cleanup() {
        // Set all elements to original color
        this.preservedColors.forEach((entry) => {
            entry.$el.css("color", entry.fg);
            entry.$el.css("background-color", entry.bg);
        });

        annotate.removeAll();
    }
}

module.exports = ContrastPlugin;
