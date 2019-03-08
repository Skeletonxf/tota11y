/**
 * A plugin to identify unclear link text such as "more" and "click here,"
 * which can make for a bad experience when using a screen reader
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("link-text");

let inContextErrorTemplate = require("./in-context-error-template.handlebars");
let linkOnlyErrorTemplate = require("./link-only-error-template.handlebars");

let stopWords = [
    "click", "tap", "go", "here", "learn", "more", "this", "page",
    "link", "about"
];
// Generate a regex to match each of the stopWords
let stopWordsRE = new RegExp(`\\b(${stopWords.join("|")})\\b`, "ig");

/*
 * JavaScript does not yet natively support unicode aware regex
 * everywhere.
 *
 * As all we need to do is strip out any punctuation this
 * extremely long string matches all punctuation in a regex.
 */
let punctuation = `\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~`;

// This does not match numbers in the text.
// Removing numbers creates false positives if a link text really is
// about 5,789,911 things or a page number.
let matchNonAlphanumericRE = new RegExp(`[${punctuation} ]`, "g");

class LinkTextPlugin extends Plugin {
    getName() {
        return "link-text";
    }

    getTitle() {
        return "Link text";
    }

    getDescription() {
        return `
            Identifies links that may be confusing when read by a screen
            reader
        `;
    }

    getAnnotate() {
        return annotate;
    }

    /**
     * Modified unclear text checking that has been refactored into
     * a single method to be called with arbitrary strings.
     *
     * Original: https://github.com/GoogleChrome/accessibility-developer-tools/blob/9183b21cb0a02f5f04928f5cb7cb339b6bbc9ff8/src/audits/LinkWithUnclearPurpose.js#L55-67
     */
    isDescriptiveText(textContent) {
        // Handle when the text is undefined or null
        if (typeof textContent === "undefined" || textContent === null) {
            return false;
        }

        textContent = textContent
            // Strip punctuation and spaces
            .replace(matchNonAlphanumericRE, "")
            // Remove the stopWords
            .replace(stopWordsRE, "");

        // Return whether or not there is any text left
        return textContent.trim() !== "";
    }

    reportError($el, $description, content, withContext) {
        let context = withContext ? "with context" : "without context";
        if (content === null) {
            let entry = this.error(
                `No link text present ${context}`,
                $description,
                $el);
            annotate.errorLabel(
                $el, "", `No link text ${context}`, entry);
        } else {
            let entry = this.error(
                `Link text is unclear ${context}`,
                $description,
                $el);
            annotate.errorLabel(
                $el, "", `Link text "${content}" is unclear ${context}`, entry);
        }
    }

    /**
     * We can call linkWithUnclearPurpose from ADT directly once the following
     * issue has been resolved. There is some extra code here until then.
     * https://github.com/GoogleChrome/accessibility-developer-tools/issues/156
     */
    run() {
        $("a").each((i, el) => {
            let $el = $(el);

            // Ignore the tota11y UI
            if ($el.parents(".tota11y").length) {
                return;
            }

            // Ignore hidden links
            if (axs.utils.isElementOrAncestorHidden(el)) {
                return;
            }

            // Ignore non links
            if (el.href === "") {
                return;
            }

            // Extract the text alternatives for this element: including
            // its text content, aria-label/labelledby, and alt text for
            // images.
            //
            // TODO: Read from `alts` to determine where the text is coming
            // from (for tailored error messages)
            let alts = {};
            let extractedTextLinkOnly = axs.properties.findTextAlternatives(
                el, alts);

            // "In HTML, information that is programmatically determinable
            // from a link in English includes text that is in the same
            // paragraph, list, or table cell as the link or in a table header
            // cell that is associated with the table cell that contains the
            // link"
            // https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html
            let $context = $el.closest("p, li, td, th");
            let extractedTextInContext = extractedTextLinkOnly;
            if ($context[0]) {
                let _alts = {};
                extractedTextInContext = axs.properties.findTextAlternatives(
                    $context[0], _alts);
            }

            if (!this.isDescriptiveText(extractedTextInContext)) {
                let $description = inContextErrorTemplate({
                    extractedText: extractedTextLinkOnly,
                    linkedImage: $el.find("img").length > 0,
                });

                this.reportError(
                        $context, $description, extractedTextInContext, true);
            } else {
                // Context can only add information so if a link is
                // unclear with context it would also be unclear without
                // so this test is only useful if the link is descriptive
                // with context
                if (!this.isDescriptiveText(extractedTextLinkOnly)) {
                    let $description = linkOnlyErrorTemplate({
                        extractedText: extractedTextLinkOnly,
                        linkedImage: $el.find("img").length > 0,
                    });

                    this.reportError(
                            $el, $description, extractedTextLinkOnly, false);
                }
            }
        });
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = LinkTextPlugin;
