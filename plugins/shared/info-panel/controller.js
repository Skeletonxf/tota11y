/**
 * The following code defines the controller for an information panel
 * that can be invoked from any plugin to display summaries, errors,
 * or more information about what its plugin is doing.
 *
 * These panels are unique to the plugin that created them.
 *
 * Info panels consist of a title and three optional sections, which form
 * tabs that users can switch between.
 *
 *   Summary: A summary of the plugin's results
 *   Errors: A list of violations reported by this plugin. The tab marker also
 *           contains the number of errors listed
 */

let $ = require("jquery");

/*
 * The info panel is depended on by every plugin and therefore cannot
 * require the plugins because it would introduce a circular dependency.
 *
 * Therefore we must depend on the plugins from a different file to
 * access this list on the Controller side, which is fine because all our
 * communication to the plugins on the page goes through the Port that the
 * InfoPanel creates.
 */

let plugins = require("../../../plugins");
let infoPanel = require("./index.js");

let errorTemplate = require("./error.handlebars");
require("./style.less");

const COLLAPSED_CLASS_NAME = "tota11y-collapsed";
const HIDDEN_CLASS_NAME = "tota11y-info-hidden";
const FIRST_ERROR_ID = 0;
const PORT_NAME = infoPanel.port;
const InfoPanel = infoPanel.panel;

let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map((p) => p.getName());

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// The background script maintains knowledge about the DevTools
// which we communicate with to trigger inspect element functionality
// for the InfoPanels Inspect Element button in the sidebar
let backgroundPort = browser.runtime.connect({
    name: "background",
});

// We also sync the status to the Inspect Element buttons
let devToolsIsActive = false;
backgroundPort.onMessage.addListener((json) => {
    if (json.devToolsStatus) {
        devToolsIsActive = json.isActive;
        $(".tota11y-info-error-inspect-element")
            .prop("disabled", !json.isActive);
    }
});

/*
 * The controller of all n info panels, delegating each
 * to an ActivePanel to mirror the InfoPanel instance on
 * the content script.
 */
class InfoPanelController {
    constructor() {
        this.activePanels = new Set();
        if (browser) {
            browser.runtime.onConnect.addListener((port) => {
                if (port.name !== PORT_NAME) {
                    return;
                }
                this.port = port;
                port.onMessage.addListener((json) => {
                    if (json.msg) {
                        console.log(`InfoPanel controller received msg: ${json.msg}, ${json}`);
                    }
                    if (json.registerActive) {
                        // retrieve the plugin instance from the name
                        let index = namedPlugins.findIndex((p) => p === json.plugin);
                        if (index === -1) {
                            port.postMessage("Unrecognised plugin");
                            return;
                        }
                        let plugin = allPlugins[index];

                        // Destroy any existing active panel for the same plugin
                        // to prevent double-renders
                        [...this.activePanels]
                        .filter((ap) => {
                            return ap.plugin.getName() === plugin.getName();
                        })
                        .forEach((ap) => {
                            this.activePanels.delete(ap);
                            ap.destroy();
                        });

                        this.activePanels.add(new ActivePanel(port, plugin));
                    }
                    if (json.elementMarked) {
                        this.sendInspectElement(json.plugin);
                    }
                });
                port.onDisconnect.addListener((port) => {
                    let activePanels = new Set();
                    for (let ap of this.activePanels) {
                        if (ap.port === port) {
                            console.log(
                                `Discarding active panel ${ap.plugin.getName()}`
                            );
                            // discard the active panel with the port
                            ap.destroy();
                        } else {
                            activePanels.add(ap);
                        }
                    }
                    this.activePanels = activePanels;
                });
            });
        }
    }

    /*
     * Sends a message to the background port to attempt to inspect
     * the marked element on the page, then communicates with the
     * content script to remove the mark from the element on the page.
     */
    sendInspectElement(plugin) {
        let _this = this;
        backgroundPort.onMessage.addListener(function receiver(json) {
            if (json.msg) {
                console.log(`Info panel controller received msg: ${json.msg}, ${json}`);
            }
            if (json.inspectedElement || json.failed) {
                backgroundPort.onMessage.removeListener(receiver);
                // Short delay for the element to actually be inspected
                // by the browser before we remove the class that marked it
                sleep(1000).then(() => {
                    _this.port.postMessage({
                        msg: "Unmark element for inspection",
                        unmarkInspectedElement: true,
                        plugin: plugin,
                    });
                })
            }
        });

        backgroundPort.postMessage({
            msg: "Inspect marked element",
            inspectMarkedElement: true,
        });
    }
}

/*
 * A currentely active info panel in the side bar, with a 1 to 1
 * correspondence to active info panels running in the content script.
 */
class ActivePanel {
    constructor(port, plugin) {
        this.port = port;
        this.plugin = plugin;

        this.about = null;
        this.summary = null;

        this.errors = new Map();

        this.$el = null;

        port.onMessage.addListener((json) => {
            if (json.msg) {
                console.log(`ActivePanel received msg: ${json.msg}, ${json}`);
            }
            if (json.setAbout) {
                //console.log(`About ${json.setAbout}`);
                // convert HTML string back to jQuery HTML object
                this.about = $(json.setAbout);
            }
            if (json.setSummary) {
                //console.log(`Summary ${json.setSummary}`);
                // convert HTML string back to jQuery HTML object
                this.summary = $(json.setSummary);
            }
            if (json.addError) {
                let error = {
                    title: json.title,
                    // convert HTML strings back to jQuery HTML objects
                    $description: $(json.description),
                    // Hold reference to the HTML string because some
                    // objects like <html> can't be recreated by jQuery
                    // and we also do not want to execute arbitray code
                    // defined on the web page by deserialising it
                    //
                    // The Navigation Plugin was tested on an auto playing
                    // audio element in the page and reconstructing the
                    // element here with jQuery caused the audio to auto
                    // play from the sidebar, which the browser provides
                    // no UI to mute!
                    elHTMLString: json.el,
                    id: json.id,
                };
                // We use the same ids as the InfoPanel in the content
                // script generates so we can map between our error
                // objects and the content script's error objects
                // by indexing the errors Map.
                this.errors.set(json.id, error);
            }
            if (json.render) {
                this.render();
            }
            if (json.directRender) {
                if (json.text) {
                    this.$el.find(".tota11y-info-section.active").text(json.text);
                } else if (json.html) {
                    this.$el.find(".tota11y-info-section.active").html($(json.html));
                }
            }
            if (json.showError) {
                if (json.plugin === this.plugin.getName()) {
                    this.showError(json.errorId);
                }
            }
            if (json.highlightOn) {
                if (json.plugin === this.plugin.getName()) {
                    this.doHighlightOn(json.errorId);
                }
            }
            if (json.highlightOff) {
                if (json.plugin === this.plugin.getName()) {
                    this.doHighlightOff(json.errorId);
                }
            }
        });
    }

    /**
     * Positions the info panel in the sidebar.
     */
    initAndPosition() {
        // Append the info panel to the body.
        $("body").append(this.$el);
    }

    render() {
        // Destroy the existing info panel to prevent double-renders
        if (this.$el) {
            this.$el.remove();
        }

        let hasContent = false;

        this.$el = (
            <div className={"tota11y tota11y-info tota11y-sidebar " + this.plugin.getName()} tabindex="-1">
                <header className="tota11y-info-title">
                    {this.plugin.getTitle()}
                    <span className="tota11y-info-controls">
                        <label className="tota11y-info-annotation-toggle">
                            Annotate:
                            {" "}
                            <input
                                className="toggle-annotation"
                                type="checkbox"
                                checked="checked" />
                        </label>
                    </span>
                </header>
                <div className="tota11y-info-body">
                    <div className="tota11y-info-sections" />
                    <ul role="tablist" className="tota11y-info-tabs" />
                </div>
            </div>
        );

        // Add the appropriate tabs based on which information the info panel
        // was provided, then highlight the most important one.
        let $activeTab;
        if (this.about) {
            $activeTab = this._addTab("About", this.about);

            // Sync all checkbox states in the about tab to the content
            // script. We do this to make the layout plugin previews work from
            // the sidebar.
            let $checkboxes = this.about.find('input[type="checkbox"]');
            $checkboxes.each((index, el) => {
                $(el).click((e) => {
                    let checked = $(e.target).prop("checked")
                    this.port.postMessage({
                        msg: "Checkbox sync",
                        checkboxSync: true,
                        checked: !!checked,
                        about: true,
                        plugin: this.plugin.getName(),
                        checkboxIndex: index
                    })
                });
            });
        }

        if (this.summary) {
            console.log("Adding summary tab");
            $activeTab = this._addTab("Summary", this.summary);
        }

        // Wire annotation toggling to go through Port as the annotate
        // module is managed by the InfoPanel running in the content script.
        this.$el.find(".toggle-annotation").click((e) => {
            if ($(e.target).prop("checked")) {
                this.port.postMessage({
                    msg: "Show annotations",
                    showAnnotations: true,
                    plugin: this.plugin.getName(),
                })
            } else {
                this.port.postMessage({
                    msg: "Hide annotations",
                    hideAnnotations: true,
                    plugin: this.plugin.getName(),
                })
            }
        });

        // Wire click to expand text
        this.$el.find(".tota11y-click-to-expand").click((e) => {
            e.preventDefault();
            e.stopPropagation();
            let $text = $(e.currentTarget);
            $text.toggleClass("tota11y-expanded");
            $text.attr("aria-expanded", $text.is(".tota11y-expanded"));
        });

        if (this.errors.size > 0) {
            let $errors = $("<ul>").addClass("tota11y-info-errors");

            this.errors.forEach((error, id) => {
                let $error = $(errorTemplate(error));

                // Insert description jQuery object into template.
                // Description is passed as jQuery object
                // so that functionality can be inserted.
                $error
                    .find(".tota11y-info-error-description")
                    .prepend(error.$description);

                $errors.append($error);

                // Wire up the expand/collapse trigger
                let $trigger = $error.find(".tota11y-info-error-trigger");
                let $desc = $error.find(".tota11y-info-error-description");

                // Sync all checkbox states in the sidebar to the content
                // script. We do this to make the text contrast previw work from
                // the sidebar.
                let $checkboxes = $desc.find('input[type="checkbox"]');
                $checkboxes.each((index, el) => {
                    $(el).click((e) => {
                        let checked = $(e.target).prop("checked")
                        this.port.postMessage({
                            msg: "Checkbox sync",
                            checkboxSync: true,
                            checked: !!checked,
                            errorId: id,
                            plugin: this.plugin.getName(),
                            checkboxIndex: index
                        })
                    });
                });

                $trigger.click((e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    $trigger.toggleClass(COLLAPSED_CLASS_NAME);
                    $desc.toggleClass(COLLAPSED_CLASS_NAME);
                });

                // Hold references to our $trigger and $desc for this error
                // to access externally when messaged to via the Port.
                // and to highlight the trigger when hovering over
                // inline error labels on the page.
                error.$trigger = $trigger;
                error.$desc = $desc;

                // Wire up the scroll-to-error button delegate
                let $scroll = $error.find(".tota11y-info-error-scroll");
                $scroll.click((e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // The error annotation isn't on the sidebar page
                    // so send the error id over the Port so we
                    // can scroll to it from the content script
                    this.port.postMessage({
                        msg: "Scroll to error on page",
                        scrollToError: true,
                        errorId: id,
                        plugin: this.plugin.getName(),
                    });
                });

                /*
                 * Highlight the violating element on hover/focus. We do it
                 * for both $trigger and $scroll to allow users to see the
                 * highlight when scrolling to the element with the button.
                 */
                $trigger.on("mouseenter focus", () => this.sendHighlightOn(id));
                $scroll.on("mouseenter focus", () => this.sendHighlightOn(id));
                $trigger.on("mouseleave blur", () => this.sendHighlightOff(id));
                $scroll.on("mouseleave blur", () => this.sendHighlightOff(id));

                // Add code from error elemnt string to the information panel
                let errorHTML = error.elHTMLString;

                // Trim the code block if it is over 300 characters
                if (errorHTML.length > 300) {
                    errorHTML = errorHTML.substring(0, 300) + "...";
                }

                let $relevantCode = $error.find(
                    ".tota11y-info-error-description-code-container code");
                $relevantCode.text(errorHTML);

                // Add a button to inspect the element
                let $inspectElement = $(
                    `<button
                        class="tota11y-info-error-inspect-element"
                        title="Inspect Element with Developer Tools (F12) - must already be open to function"
                        aria-label="Inspect Element with Developer Tools (F12) - must already be open to function"
                     >
                        Inspect element
                    </button>`);
                $inspectElement.appendTo(
                    $error.find(".tota11y-info-error-description"));
                // Start the communications over the Port to
                // inspect the element from the devtools
                $inspectElement.click(() => {
                    this.port.postMessage({
                        msg: "Inspect element",
                        inspectElement: true,
                        errorId: id,
                        plugin: this.plugin.getName(),
                    });
                });
                $inspectElement.prop("disabled", !devToolsIsActive);
            });

            // Store a reference to the "Errors" tab so we can switch to it
            // later
            this.$errorsTab = $activeTab = this._addTab("Errors", $errors);

            // Add a small badge next to the tab title
            let $badge = $("<div>")
                .addClass("tota11y-info-error-count")
                .text(this.errors.size);

            $activeTab.find(".tota11y-info-tab-anchor").append($badge);
        }

        if ($activeTab) {
            $activeTab.trigger("activate");
            // hasContent is technically coupled to $activeTab, since if there
            // is no $activeTab then there is no content. This behavior may
            // change in the future.
            hasContent = true;
        }

        if (hasContent) {
            this.initAndPosition();
        }

        // (a11y) Shift focus to the newly-opened info panel
        this.$el.focus();

        if (this.errors.size > 0) {
            // Jump to the first violation.
            this.showError(FIRST_ERROR_ID);
        }

        return this.$el;
    }

    /*
     * Maps an error id back to the error object held by this port
     * to display the error. We'll use this to access error entries
     * in this active panel from the content script's labels.
     *
     * Note that we are using our error object which we created
     * in the sidebar and not the same object the InfoPanel in
     * the content script created (but they will have the same ids).
     */
    showError(errorId) {
        let error = this.errors.get(errorId);

        if (error === undefined) {
            return;
        }

        // Make sure active panel is visible
        this.$el.removeClass(HIDDEN_CLASS_NAME);

        // Open the error entry
        error.$trigger.removeClass(COLLAPSED_CLASS_NAME);
        error.$desc.removeClass(COLLAPSED_CLASS_NAME);

        // Switch to the "Errors" tab
        this.$errorsTab.trigger("activate");

        // Scroll to the error entry smoothly
        $("html, body").animate({
            scrollTop: error.$trigger.offset().top - 10
        }, 50);
    }

    /*
     * Sends the highlight on/off instructions over the Port
     * to allow the InfoPanel to apply the highlighting to its
     * annotations on the page.
     */
    sendHighlightOn(errorId) {
        // We provide no message as this will be sent very frequently
        this.port.postMessage({
            highlightOn: true,
            errorId: errorId,
            plugin: this.plugin.getName(),
        });
    }
    sendHighlightOff(errorId) {
        // We provide no message as this will be sent very frequently
        this.port.postMessage({
            highlightOff: true,
            errorId: errorId,
            plugin: this.plugin.getName(),
        });
    }

    /*
     * Applies highlighting to the error entry's trigger.
     */
    doHighlightOn(errorId) {
        let error = this.errors.get(errorId);

        if (error === undefined) {
            return;
        }

        error.$trigger.addClass("trigger-highlight");
    }

    doHighlightOff(errorId) {
        let error = this.errors.get(errorId);

        if (error === undefined) {
            return;
        }

        error.$trigger.removeClass("trigger-highlight");
    }

    destroy() {
        // Reset contents
        this.about = null;
        this.summary = null;
        this.errors = new Map();

        // Remove the element
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }

        this.port = null;
    }
}
// copy tab method
ActivePanel.prototype._addTab = InfoPanel.prototype._addTab;

module.exports = InfoPanelController;
