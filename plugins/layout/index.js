let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("layout");
let layoutTests = require("./tests");

let aboutTemplate = require("./about.handlebars");

class LayoutPlugin extends Plugin {
    constructor() {
        super();
    }

    getName() {
        return "layout";
    }

    getTitle() {
        return "Layout"
    }

    getDescription() {
        return `
            Checks the page layout is robust to user style sheets and other
            modifications
        `;
    }

    getAnnotate() {
        return annotate;
    }

    run() {
        layoutTests.forEach((test) => {
            test.apply();
            test.detect();
            test.cleanup();
        });

        layoutTests.forEach((test) => {
            test.report(this.panel);
        });

        let $about = $(aboutTemplate());
        layoutTests.forEach((test) => {
            let previewClass = test.getPreviewClass();
            if (previewClass) {
                $about.find(`.${previewClass}`).click((e) => {
                    if ($(e.target).prop("checked")) {
                        test.apply();
                    } else {
                        test.cleanup();
                    }
                    annotate.refreshAll();
                });
            }
        });
        this.about($about);
    }

    cleanup() {
        layoutTests.forEach((test) => {
            test.cleanup();
        });
        annotate.removeAll();
    }
}

module.exports = LayoutPlugin;
