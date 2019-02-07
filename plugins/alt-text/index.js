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
        // Check elements for captions and/or text alternatives of any kind
        // (ie alt tags for images)
        $(`audio, video, img, input[type="image"], object`).each((i, el) => {
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
            // Remove false negative when noLabel is the only key in
            // text alternatives
            delete textAlternatives["noLabel"];
            let noTextAlternatives = Object.keys(textAlternatives).length === 0;

            let elementName = $el.prop("tagName").toLowerCase();

            if (elementName === "img") {
                if (noTextAlternatives) {
                    this.reportImageError(el);
                }
                return;
            }

            if (elementName === "input") {
                console.log(`Element: ${el}, ${JSON.stringify(textAlternatives)}`);
                if (noTextAlternatives) {
                    // TODO custom error
                    this.reportImageError(el);
                }
                return;
            }

            let hasCaptions = $el.find("track[kind=captions]").length > 0;

            if (noTextAlternatives && !hasCaptions) {
                // TODO Split into independent errors
                // TODO custom error for object elements
                this.reportAudiovisualError(
                    el, $el.prop("tagName").toLowerCase()
                );
            }
        });

        // Additionally, label presentational elements
        $(`img[role="presentation"],
                img[alt=""],
                input[type="image"][alt=""],
                input[type="image"][role="presentation"],
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

        this.about($(aboutTemplate()));
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = AltTextPlugin;
