/**
 * A plugin to identify unlabeled inputs
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("labels");
let audit = require("../shared/audit");

let errorTemplate = require("./error-template.handlebars");

class FormsPlugin extends Plugin {
    getName() {
        return "forms";
    }

    getTitle() {
        return "Forms";
    }

    getDescription() {
        return "Identifies inputs with missing labels";
    }

    getAnnotate() {
        return annotate;
    }

    errorMessage($el) {
        return errorTemplate({
            placeholder: $el.attr("placeholder"),
            id: $el.attr("id"),
            tagName: $el.prop("tagName").toLowerCase()
        });
    }

    run() {
        let {result, elements} = audit("controlsWithoutLabel");

        if (result === "FAIL") {
            elements.forEach((element) => {
                let $el = $(element);
                let title = "Input is missing a label";

                // Place an error label on the element and register it as an
                // error in the info panel
                let entry = this.error(title, $(this.errorMessage($el)), $el);
                annotate.errorLabel($el, "", title, entry);
            });
        }

        $("progress, meter").each((i, el) => {
            let $el = $(el);

            // filter in the same way as the audit, ignoring elements "which
            // have negative tabindex and an ancestor with a widget role,
            // since they can be accessed neither with tab nor with
            // a screen reader"
            // https://github.com/GoogleChrome/accessibility-developer-tools/blob/3d7c96bf34b3146f40aeb2720e0927f221ad8725/src/audits/ControlsWithoutLabel.js#L38
            if (el.tabindex < 0) {
                return;
            }
            for (let parent = axs.dom.parentElement(el);
                    parent != null;
                    parent = axs.dom.parentElement(parent)) {
                if (axs.utils.elementIsAriaWidget(parent)) {
                    return;
                }
            }

            let text = $el.text().replace(/^\s+|\s+$/g, '');

            let hasLabel = axs.utils.hasLabel(el);

            let textAlternatives = {};
            axs.properties.findTextAlternatives(el, textAlternatives);
            // // Remove false negative when noLabel is the only key in
            // // text alternatives
            // delete textAlternatives["noLabel"];
            let noTextAlternatives = Object.keys(textAlternatives).length === 0;

            console.log(`text alt: ${JSON.stringify(textAlternatives)}, text: ${text}, label: ${hasLabel}`);
        });
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = FormsPlugin;
