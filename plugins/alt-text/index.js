/**
 * A plugin to check for valid alternative representations for images
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("alt-text");
let audit = require("../shared/audit");

let imageErrorTemplate = require("./image-error-template.handlebars");
let inputErrorTemplate = require("./input-image-error-template.handlebars");
let fallbackTextErrorTemplate = require("./no-fallback-text-error-template.handlebars");
let noCaptionsErrorTemplate = require("./no-captions-error-template.handlebars");
let noAudioDescriptionErrorTemplate = require("./no-audio-description-error-template.handlebars");
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

    reportInputError(el) {
        let $el = $(el);
        let src = $el.attr("src") || "..";
        let title = "Input image is missing alt text";
        let $error = inputErrorTemplate({
            src: src,
        });

        // Place an error label on the element and register it as an
        // error in the info panel
        let entry = this.error(title, $error, $el);
        annotate.errorLabel($el, "", title, entry);
    }

    reportErrorFactory(_title, template) {
        return (el, elementName) => {
            let $el = $(el);
            let elementCapitalised = elementName.charAt(0).toUpperCase() +
                elementName.slice(1);
            let title = `${elementCapitalised} ${_title}`;
            let $error = template({
                elementName: elementName,
            });

            // Place an error label on the element and register it as an
            // error in the info panel
            let entry = this.error(title, $error, $el);
            annotate.errorLabel($el, "", title, entry);
        }
    }

    reportFallbackTextError(el, elementName) {
        this.reportErrorFactory(
            "is missing text alternatives",
            fallbackTextErrorTemplate)(el, elementName);
    }

    reportNoCaptionsError(el, elementName) {
        this.reportErrorFactory(
            "has no captions",
            noCaptionsErrorTemplate)(el, elementName);
    }

    reportNoAudioDescriptionError(el, elementName) {
        this.reportErrorFactory(
            "has no audio descriptions",
            noAudioDescriptionErrorTemplate)(el, elementName);
    }

    run() {
        // Check elements for captions and/or text alternatives of any kind
        // (ie alt tags for images)
        $('audio, video, img, input[type="image"], object').each((i, el) => {
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
                if (noTextAlternatives) {
                    this.reportInputError(el);
                }
                return;
            }

            let hasCaptions = $el.find('track[kind="captions"]').length > 0;
            let hasAudioDescription = $el.find('track[kind="descriptions"]').length > 0;

            if (noTextAlternatives && !hasCaptions && !hasAudioDescription) {
                this.reportFallbackTextError(el, elementName);
            }

            if (elementName === "video") {
                // FIXME Detect the most suitable ARIA for indicating
                // the element is a media alternative to text, in which
                // case this test does not apply.
                if (!hasCaptions) {
                    this.reportNoCaptionsError(el, elementName);
                }
                if (!hasAudioDescription) {
                    this.reportNoAudioDescriptionError(el, elementName);
                }
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
