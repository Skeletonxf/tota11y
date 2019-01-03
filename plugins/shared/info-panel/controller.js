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
let annotate = require("../annotate")("info-panel");

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
const PORT_NAME = infoPanel.port;
const InfoPanel = infoPanel.panel;

let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map((p) => p.getName());

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
                port.onMessage.addListener((json) => {
                    console.log(`InfoPanel controller received msg: ${json.msg}, ${json}`);
                    if (json.registerActive) {
                        // retrieve the plugin instance from the name
                        let index = namedPlugins.findIndex((p) => p === json.plugin);
                        if (index === -1) {
                            port.postMessage("Unrecognised plugin");
                            return;
                        }
                        let plugin = allPlugins[index];
                        console.log('registering active panel');
                        this.activePanels.add(new ActivePanel(port, plugin));
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
            })
        }
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
        this.errors = [];

        this.$el = null;

        port.onMessage.addListener((json) => {
            console.log(`ActivePanel received msg: ${json.msg}, ${json}`);
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
                console.log("Recieved error");
                // console.log(json.title);
                // console.log(json.description);
                // console.log(json.el);
                // TODO: Highlight information
                let error = {
                    title: json.title,
                    // convert HTML strings back to jQuery HTML objects
                    $description: $(json.description),
                    $el: $(json.el),
                };
                this.errors.push(error);
            }
            if (json.render) {
                this.render();
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
        console.log("ActivePanel rendering");

        // Destroy the existing info panel to prevent double-renders
        if (this.$el) {
            this.$el.remove();
        }

        let hasContent = false;

        this.$el = (
            <div className="tota11y tota11y-info tota11y-sidebar" tabindex="-1">
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
                        <a aria-label="Close info panel"
                           href="#"
                           className="tota11y-info-dismiss-trigger">
                            &times;
                        </a>
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
        }

        if (this.summary) {
            console.log("Adding summary tab");
            $activeTab = this._addTab("Summary", this.summary);
        }

        // Wire annotation toggling
        this.$el.find(".toggle-annotation").click((e) => {
            if ($(e.target).prop("checked")) {
                annotate.show();
            } else {
                annotate.hide();
            }
        });

        if (this.errors.length > 0) {
            let $errors = $("<ul>").addClass("tota11y-info-errors");

            // Store a reference to the "Errors" tab so we can switch to it
            // later
            let $errorsTab;

            this.errors.forEach((error, i) => {
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

                $trigger.click((e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    $trigger.toggleClass(COLLAPSED_CLASS_NAME);
                    $desc.toggleClass(COLLAPSED_CLASS_NAME);
                });

                // Attach a function to the original error object to open
                // this error so it can be done externally. We'll use this to
                // access error entries in the info panel from labels.
                error.show = () => {
                    // // Make sure info panel is visible
                    // this.$el.removeClass(HIDDEN_CLASS_NAME);
                    //
                    // // Open the error entry
                    // $trigger.removeClass(COLLAPSED_CLASS_NAME);
                    // $desc.removeClass(COLLAPSED_CLASS_NAME);

                    // Switch to the "Errors" tab
                    $errorsTab.trigger("activate");

                    // // Scroll to the error entry
                    // let $scrollParent = $trigger.parents(
                    //     ".tota11y-info-section");
                    // $scrollParent[0].scrollTop = $trigger[0].offsetTop - 10;
                };
                //
                // // Attach the `$trigger` as well so can access it externally.
                // // We use this to highlight the trigger when hovering over
                // // inline error labels.
                // error.$trigger = $trigger;
                //
                // // Wire up the scroll-to-error button
                // let $scroll = $error.find(".tota11y-info-error-scroll");
                // $scroll.click((e) => {
                //     e.preventDefault();
                //     e.stopPropagation();
                //
                //     // TODO: This attempts to scroll to fixed elements
                //     $(document).scrollTop(error.$el.offset().top - 80);
                // });

                // Expand the first violation
                if (i === 0) {
                    $desc.toggleClass(COLLAPSED_CLASS_NAME);
                    $trigger.toggleClass(COLLAPSED_CLASS_NAME);
                }
                //
                // // Highlight the violating element on hover/focus. We do it
                // // for both $trigger and $scroll to allow users to see the
                // // highlight when scrolling to the element with the button.
                // annotate.toggleHighlight(error.$el, $trigger);
                // annotate.toggleHighlight(error.$el, $scroll);

                // Add code from error.$el to the information panel
                let errorHTML = error.$el[0].outerHTML;

                // Trim the code block if it is over 300 characters
                if (errorHTML.length > 300) {
                    errorHTML = errorHTML.substring(0, 300) + "...";
                }

                let $relevantCode = $error.find(
                    ".tota11y-info-error-description-code-container code");
                $relevantCode.text(errorHTML);
            });

            $errorsTab = $activeTab = this._addTab("Errors", $errors);

            // Add a small badge next to the tab title
            let $badge = $("<div>")
                .addClass("tota11y-info-error-count")
                .text(this.errors.length);

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

        return this.$el;
    }

    destroy() {
        // Reset contents
        this.about = null;
        this.summary = null;
        this.errors = [];

        // Remove the element
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }

        // Remove the annotations
        annotate.removeAll();
    }
}
// copy tab method
ActivePanel.prototype._addTab = InfoPanel.prototype._addTab;

module.exports = InfoPanelController;
