let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("navigation");

let errorTemplate = require("./error-template.handlebars");

class NavigationPlugin extends Plugin {
    getName() {
        return "navigation";
    }

    getTitle() {
        return "Navigation";
    }

    getDescription() {
        return "Detects elements on the page that may interfere with navigation";
    }

    getAnnotate() {
        return annotate;
    }

    reportError($el) {
        let $description = errorTemplate({
            elementName: $el.prop("tagName").toLowerCase(),
        });

        let entry = this.error("Autoplaying audio", $description, $el);
        annotate.errorLabel($el, "",
            "Autoplaying audio", entry);
    }

    run() {
        $("audio[autoplay], video[autoplay]")
        .filter((i, el) => {
            // Keep only audio and video elements that have audio
            // lasting more than 3 seconds, no controls to mute
            // the audio and are not muted by default
            return !el.controls
                && (el.duration <= 3 || el.loop)
                // FIXME: Firefox disables this JS API by default, locked
                // behind about:config setting, so need to use the Web Audio
                // API instead
                // && el.audioTracks.length !== 0
                && !el.defaultMuted
        })
        .each((i, el) => {
            this.reportError($(el));
        });
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = NavigationPlugin;
