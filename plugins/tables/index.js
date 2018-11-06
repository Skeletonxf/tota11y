/**
 * A plugin to identify malformed tables
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("tables");
let audit = require("../shared/audit");

let errorTemplate = require("./error-template.handlebars");

class TablesPlugin extends Plugin {
    getName() {
        return "table-headers";
    }

    getTitle() {
        return "Tables";
    }

    getDescription() {
        return "Identifies tables with missing or incomplete headers";
    }

    errorMessage($el) {
        return errorTemplate({
            id: $el.attr("id"),
            presentation: $el.attr("role") === "presentation",
            noHeadings: $el.find('th').length === 0,
            tagName: $el.prop("tagName").toLowerCase()
        });
    }

    run() {
        /*
        ariaOnReservedElement,ariaOwnsDescendant,ariaRoleNotScoped,audioWithoutControls,badAriaAttribute,badAriaAttributeValue,badAriaRole,controlsWithoutLabel,duplicateId,focusableElementNotVisibleAndNotAriaHidden,humanLangMissing,imagesWithoutAltText,linkWithUnclearPurpose,lowContrastElements,mainRoleOnInappropriateElement,elementsWithMeaningfulBackgroundImage,multipleAriaOwners,multipleLabelableElementsPerLabel,nonExistentRelatedElement,pageWithoutTitle,requiredAriaAttributeMissing,requiredOwnedAriaRoleMissing,roleTooltipRequiresDescribedby,tabIndexGreaterThanZero,tableHasAppropriateHeaders,uncontrolledTabpanel,unfocusableElementsWithOnClick,unsupportedAriaAttribute,videoWithoutCaptions
        */

        let {result, elements} = audit("tableHasAppropriateHeaders");

        if (result === "FAIL") {
            elements.forEach((element) => {
                let $el = $(element);

                let presentation = $el.attr("role") === "presentation";
                let noHeadings = $el.find('th').length === 0;

                let title = "Table has a problem with its headers";
                if (presentation && !noHeadings) {
                    title = "Presentational table should not have headers";
                }
                if (!presentation && noHeadings) {
                    title = "Table is missing headers";
                }

                // Place an error label on the element and register it as an
                // error in the info panel
                let entry = this.error(title, $(this.errorMessage($el)), $el);
                annotate.errorLabel($el, "", title, entry);
            });
        }
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = TablesPlugin;
