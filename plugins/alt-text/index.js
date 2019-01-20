/**
 * A plugin to check for valid alternative representations for images
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("alt-text");
let audit = require("../shared/audit");

let imageErrorTemplate = require("./image-error-template.handlebars");
let audiovisualErrorTemplate = require("./audiovisual-error-template.handlebars");
let aboutTemplate = require("./about.handlebars");

require("./style.less");

class AltTextPlugin extends Plugin {
    getName() {
        return "alt-text";
    }

    getTitle() {
        return "Alternative text";
    }

    getDescription() {
        return "Annotates elements without text alternatives";
    }

    getAnnotate() {
        return annotate;
    }

    reportImageError(el) {
        let $el = $(el);
        let src = $el.attr("src") || "..";
        let title = "Image is missing alt text";
        let $error = imageErrorTemplate({
            src: src,
        });

        // Place an error label on the element and register it as an
        // error in the info panel
        let entry = this.error(title, $error, $el);
        annotate.errorLabel($el, "", title, entry);
    }

    reportAudiovisualError(el, elementName) {
        let $el = $(el);
        let elementCapitalised = elementName.charAt(0).toUpperCase() +
            elementName.slice(1);
        let title = `${elementCapitalised} is missing text alternatives`;
        let $error = audiovisualErrorTemplate({
            elementName: elementName,
        });

        // Place an error label on the element and register it as an
        // error in the info panel
        let entry = this.error(title, $error, $el);
        annotate.errorLabel($el, "", title, entry);
    }

    run() {
        // Generate errors for any images that fail the Accessibility
        // Developer Tools audit
        let {result, elements} = audit("imagesWithoutAltText");

        if (result === "FAIL") {
            elements.forEach(this.reportImageError.bind(this));
        }

        // Additionally, label presentational elements
        $(`img[role="presentation"],
                img[alt=""],
                video[role="presentation"],
                audio[role="presentation"]`).each((i, el) => {
            // "Error" labels have a warning icon and expanded text on hover,
            // but we add a special `warning` class to color it differently.
            let $el = $(el);
            annotate
                .errorLabel(
                    $el,
                    "",
                    `This ${$el.prop("tagName").toLowerCase()} is decorative`)
                .addClass("tota11y-label-warning");
        });

        // Also check audio and video elements for captions and text
        // alternatives of any kind
        $(`audio, video`).each((i, el) => {
            let $el = $(el);

            if (axs.utils.isElementOrAncestorHidden(el)) {
                // skip hidden elements
                return;
            }

            if ($el.attr("role") === "presentation") {
                // ignore presentational elements
                return;
            }

            let textAlternatives = {};
            axs.properties.findTextAlternatives(el, textAlternatives);
            let noTextAlternatives = Object.keys(textAlternatives).length === 0;

            let hasCaptions = $el.find("track[kind=captions]").length > 0;

            if (noTextAlternatives && !hasCaptions) {
                this.reportAudiovisualError(
                    el, $el.prop("tagName").toLowerCase()
                );
            }
        });

        this.about($(aboutTemplate()));
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = AltTextPlugin;
