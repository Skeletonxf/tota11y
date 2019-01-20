let $ = require("jquery");

let plugins = require("./plugins");
let logoTemplate = require("./templates/logo.handlebars");

const PORT_NAME = "toolbar";

let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map((p) => p.getName());

const DISABLE_CSS = "tota11y-disabled-toolbar";

/**
 * In a standalone script the toolbar is responsible for switching
 * active plugins and drawing its UI.
 * In a WebExtension the UI and the content script run in different
 * JS sandboxes, ie the content script can use eval() but not most
 * WebExtension APIs and the sidebar UI JS can use WebExtension APIs
 * but not eval(). Therefore the toolbar becomes responsible for
 * everything but the UI, and the UI is synced to the rest of
 * the WebExtension over a Port.
 */
class Toolbar {
    constructor() {
        this.activePlugins = new Set();
    }

    /**
     * Manages the state of the toolbar when a plugin is clicked, and toggles
     * the appropriate plugins on and off.
     */
    handlePluginClick(plugin) {
        console.log(`Handling plugin click ${plugin}`);
        // If the plugin was already selected, toggle it off
        if (this.activePlugins.has(plugin)) {
            plugin.deactivate();
            this.activePlugins.delete(plugin);
        } else {
            // Activate the selected plugin
            plugin.activate();
            this.activePlugins.add(plugin);
        }
    }

    /**
     * Renders the toolbar and appends it to the specified element.
     */
    appendTo($el) {
        let $logo = $(logoTemplate());
        let $toolbar;

        let $defaultPlugins = plugins.default.map((Plugin) => { // eslint-disable-line no-unused-vars
            return <Plugin onClick={this.handlePluginClick.bind(this)} />;
        });

        let $experimentalPlugins = null;
        if (plugins.experimental.length) {
            $experimentalPlugins = (
                <li>
                    <div className="tota11y-plugins-separator">
                        Experimental
                    </div>
                    <ul>
                      {
                          plugins.experimental.map((Plugin) => { // eslint-disable-line no-unused-vars
                              return (
                                  <Plugin onClick={this.handlePluginClick.bind(this)} />
                              );
                          })
                      }
                    </ul>
                </li>
            );
        }

        let $plugins = (
            <ul className="tota11y-plugins">
                {$defaultPlugins}
                {$experimentalPlugins}
            </ul>
        );

        let handleToggleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            $toolbar.toggleClass("tota11y-expanded");
            $toolbar.attr("aria-expanded", $toolbar.is(".tota11y-expanded"));
        };

        let $toggle = (
            <button aria-controls="tota11y-toolbar"
                    className="tota11y-toolbar-toggle"
                    onClick={handleToggleClick}
                    aria-label="[tota11y] Toggle menu">
                <div aria-hidden="true" className="tota11y-toolbar-logo">
                    {$logo}
                </div>
            </button>
        );

        $toolbar = (
            <div id="tota11y-toolbar" className="tota11y tota11y-toolbar"
                 role="region"
                 aria-expanded="false">
                <div className="tota11y-toolbar-body">
                    {$plugins}
                </div>
                {$toggle}
            </div>
        );

        $el.append($toolbar);
        this.$el = $toolbar;

        if (browser) {
            // Disable this toolbar as the sidebar will be controlling
            // the active plugins
            this.$el.addClass(DISABLE_CSS);
        }
    }

    /**
     * Opens a port to communicate to a ToolbarController
     * over the browser.runtime API.
     */
    delegate() {
        if (browser) {
            console.log("Opening toolbar port");
            let port = browser.runtime.connect({
                name: PORT_NAME
            });
            this.port = port;
            port.postMessage({msg: "Opened port"});

            port.onMessage.addListener((json) => {
                console.log(`Toolbar received msg: ${json.msg}, ${json}`);
                if (json.click) {
                    // retrieve the plugin instance from the name
                    let index = namedPlugins.findIndex(p => p === json.click);
                    if (index !== -1) {
                        let plugin = allPlugins[index];
                        console.log(`Plugin click sent through port ${plugin.getName()}`);
                        let doToggle = (
                            this.activePlugins.has(plugin) !=
                            json.active
                        );
                        if (doToggle) {
                            // only toggle the plugin if not in sync with
                            // controller
                            this.handlePluginClick(plugin);
                        } else {
                            console.log("Skipped, plugin already synced state");
                        }
                    } else {
                        port.postMessage("Unrecognised plugin");
                    }
                }
                if (json.sync) {
                    console.log("Syncing active plugins to controller");
                    let activePlugins = new Set(json.activePlugins);
                    for (let plugin of allPlugins) {
                        let activate = activePlugins.has(plugin.getName());
                        let active = this.activePlugins.has(plugin);
                        if (activate != active) {
                            // toggle all plugins that aren't
                            // in sync with the controller
                            this.handlePluginClick(plugin);
                        }
                    }
                }
            });
            port.onDisconnect.addListener(() => {
                // clean up
                for (let plugin of this.activePlugins) {
                    // toggle all plugins off
                    this.handlePluginClick(plugin);
                }
                console.log("Destroying toolbar");
                // Remove this toobar element
                if (this.$el) {
                    this.$el.remove();
                    this.$el = null;
                }
            });
        }
    }
}

/**
 * Responsible for the other side of the port to communicate to
 * a Toolbar over the browser.runtime API.
 */
class ToolbarController {
    constructor() {
        if (browser) {
            this.activePlugins = new Set();
            browser.runtime.onConnect.addListener((port) => {
                if (port.name !== PORT_NAME) {
                    return;
                }
                if (this.port) {
                    console.log("Disconnecting old Port");
                    this.port.disconnect();
                }
                this.port = port;
                this.port.onMessage.addListener((json) => {
                    console.log(`Toolbar controller received msg: ${json.msg}, ${json}`);
                });
                this.syncActivePlugins();
            })
        }
    }

    syncActivePlugins() {
        if (!this.port) {
            return;
        }
        this.port.postMessage({
            msg: "Sync active plugins",
            sync: true,
            activePlugins: [...this.activePlugins].map(p => p.getName()),
        })
    }

    handlePluginClick(plugin) {
        if (this.activePlugins.has(plugin)) {
            this.activePlugins.delete(plugin);
            // use function scoping so we can access this
            // outside the if statement
            var active = false;
        } else {
            this.activePlugins.add(plugin);
            // use function scoping so we can access this
            // outside the if statement
            var active = true;
        }
        this.port.postMessage({
            msg: "Plugin click",
            // Plugin instance will be different and not go
            // through JSON so pass the name instead.
            click: plugin.getName(),
            active: active,
        });
    }

    /**
     * Renders the toolbar and appends it to the specified element.
     */
    appendTo($el) {
        let $logo = $(logoTemplate());
        let $toolbar;

        let $defaultPlugins = plugins.default.map((Plugin) => { // eslint-disable-line no-unused-vars
            return <Plugin onClick={this.handlePluginClick.bind(this)} />;
        });

        let $experimentalPlugins = null;
        if (plugins.experimental.length) {
            $experimentalPlugins = (
                <li>
                    <div className="tota11y-plugins-separator">
                        Experimental
                    </div>
                    <ul>
                      {
                          plugins.experimental.map((Plugin) => { // eslint-disable-line no-unused-vars
                              return (
                                  <Plugin onClick={this.handlePluginClick.bind(this)} />
                              );
                          })
                      }
                    </ul>
                </li>
            );
        }

        let $plugins = (
            <ul className="tota11y-plugins">
                {$defaultPlugins}
                {$experimentalPlugins}
            </ul>
        );

        $toolbar = (
            <div id="tota11y-toolbar" className="tota11y tota11y-toolbar tota11y-expanded tota11y-sidebar"
                 role="region"
                 aria-expanded="true">
                <div className="tota11y-toolbar-body">
                    {$plugins}
                </div>
            </div>
        );

        $el.append($toolbar);
    }
}

module.exports = {
   toolbar: Toolbar,
   controller: ToolbarController,
}
