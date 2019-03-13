/*
 * A plugin to check the document metadata for the presence of important data
 */

let $ = require("jquery");
let Plugin = require("../base");

let summaryTemplate = require("./summary-template.handlebars");
let noLangErrorTemplate = require("./no-lang-error-template.handlebars");
let noPageTitleErrorTemplate = require("./no-page-title-error-template.handlebars");
let aboutTemplate = require("./about.handlebars");

class DocumentPlugin extends Plugin {
    getName() {
        return "document";
    }

    getTitle() {
        return "Document";
    }

    getDescription() {
        return "Checks the document for the presence of important meta data";
    }

    run() {
        if (!$("html").attr("lang")) {
            this.error(
                "No language declared", noLangErrorTemplate(), $("html"));
        }

        if ((!document.title) || document.title === "") {
            this.error("No page title", noPageTitleErrorTemplate(), $("head"));
        }

        this.summary(summaryTemplate({
            language: $("html").attr("lang"),
            title: document.title,
        }));

        this.about($(aboutTemplate()));
    }

    cleanup() {
    }
}

module.exports = DocumentPlugin;
