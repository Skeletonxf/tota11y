let $ = require("jquery");

let plugins = require("./plugins");
let settings = require("./settings");
let logoTemplate = require("./templates/logo.handlebars");

const debug = require("./utils/debugging.js");

const PORT_NAME = "toolbar";
const INIT_PORT = "init";

let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map((p) => p.getName());
let namedSettings = settings.map((p) => p.getName());
const DISABLE_CSS = "tota11y-disabled-toolbar";
const isBrowser = typeof browser !== 'undefined';

/**
 * In a standalone script the toolbar is responsible for switching
 * active plugins and drawing its UI.
 * In a WebExtension the UI and the content script run in different
 * JS sandboxes with different priviledges. Therefore the toolbar becomes
 * responsible for everything but the UI, and the UI is synced to the rest of
 * the WebExtension over a Port to the ToolbarController.
 */
class Toolbar {
    constructor() {
        this.activePlugins = new Set();
        this.activeSettings = new Set();
        this.windowId = -1;
    }

    /**
     * Manages the state of the toolbar when a plugin is clicked, and toggles
     * the appropriate plugins on and off.
     */
    handlePluginClick(plugin) {
        // If the plugin was already selected, toggle it off
        if (this.activePlugins.has(plugin)) {
            plugin.deactivate();
            this.activePlugins.delete(plugin);
        } else {
            // Activate the selected plugin
            plugin.activate(this.windowId);
            this.activePlugins.add(plugin);
        }
    }

    /*
     * Manages the active setting strings in a similar way to plugins,
     */
    handleSettingClick(setting) {
        if (!setting.applyToPage()) {
            // skip
            return;
        }
        if (this.activeSettings.has(setting)) {
            setting.deactivate();
            this.activeSettings.delete(setting);
        } else {
            setting.activate();
            this.activeSettings.add(setting);
        }
    }

    /**
     * Renders the toolbar and appends it to the specified element.
     */
    appendTo($el) {
        let $logo = $(logoTemplate());
        let $toolbar;

        let $plugins = buildPlugins.bind(this)(false);

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

        if (isBrowser) {
            // Disable this toolbar as the sidebar will be controlling
            // the active plugins

            this.$el.addClass(DISABLE_CSS);
            this.$el.attr("role", "presentation");
            this.$el.removeAttr("aria-expanded");

            let $button = this.$el.find(".tota11y-toolbar-toggle");
            $button.prop("disabled", true);
            $button.removeAttr("aria-controls");
            $button.attr("aria-label", "[tota11y] Indicator");

            this.$el.find(".tota11y-toolbar-body").remove();
        }
    }

    /**
     * Opens a port to communicate to a ToolbarController
     * over the browser.runtime API.
     */
    delegate() {
        if (isBrowser) {
            // We need to establish what window we are in so
            // first listen to window id from the Port communication
            let getWindowId = (port) => {
                port.onMessage.addListener((json) => {
                    if (json.windowId) {
                        this.windowId = json.windowId;
                        this._delegate();
                        port.disconnect();
                    }
                });
                port.postMessage({
                    msg: "Need window id for initialisation",
                    getWindowId: true,
                });
                browser.runtime.onConnect.removeListener(getWindowId);
            };
            browser.runtime.onConnect.addListener(getWindowId);
        }
    }

    /*
     * Performs the actual task of delegating to the ToolbarController
     * once we know what our window id is.
     */
    _delegate() {
        let port = browser.runtime.connect({
            name: `${PORT_NAME}${this.windowId}`
        });
        this.port = port;
        port.postMessage({msg: `Opened port for window ${this.windowId}`});

        port.onMessage.addListener((json) => {
            debug.log(`Toolbar received msg: ${json.msg}, ${json}`);
            if (json.pluginClick) {
                // retrieve the plugin instance from the name
                let index = namedPlugins.findIndex(p => p === json.pluginClick);
                if (index !== -1) {
                    let plugin = allPlugins[index];
                    debug.log(`Plugin click sent through port ${plugin.getName()}`);
                    let doToggle = (
                        this.activePlugins.has(plugin) !==
                        json.active
                    );
                    if (doToggle) {
                        // only toggle if not in sync with controller
                        this.handlePluginClick(plugin);
                    }
                } else {
                    port.postMessage("Unrecognised plugin");
                }
            }
            if (json.settingClick) {
                // retrieve the setting instance from the name
                let index = namedSettings.findIndex(s => s === json.settingClick);
                if (index !== -1) {
                    let setting = settings[index];
                    debug.log(`Setting click sent through port ${setting.getName()}`);
                    let doToggle = (
                        this.activeSettings.has(setting) !==
                        json.active
                    )
                    if (doToggle) {
                        // only toggle if not in sync with controller
                        this.handleSettingClick(setting);
                    }
                } else {
                    port.postMessage("Unrecognised setting");
                }
            }
            if (json.sync) {
                debug.log("Syncing active plugins and settings");
                let activePlugins = new Set(json.activePlugins);
                for (let plugin of allPlugins) {
                    let activate = activePlugins.has(plugin.getName());
                    let active = this.activePlugins.has(plugin);
                    if (activate !== active) {
                        // only toggle if not in sync with controller
                        this.handlePluginClick(plugin);
                    }
                }
                let activeSettings = new Set(json.activeSettings);
                for (let setting of settings) {
                    let activate = activeSettings.has(setting.getName());
                    let active = this.activeSettings.has(setting);
                    if (activate !== active) {
                        // only toggle if not in sync with controller
                        this.handleSettingClick(setting);
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
            // Remove this toobar element
            if (this.$el) {
                this.$el.remove();
                this.$el = null;
            }
        });
    }
}

/**
 * Responsible for the other side of the port to communicate to
 * a Toolbar over the browser.runtime API.
 */
class ToolbarController {
    constructor() {
        if (isBrowser) {
            this.activePlugins = new Set();
            this.activeSettings = new Set();
            this.windowId = -1;

            browser.runtime.onConnect.addListener((port) => {
                if (port.name !== `${PORT_NAME}${this.windowId}`) {
                    return;
                }
                if (this.port) {
                    debug.log("Disconnecting old Port");
                    this.port.disconnect();
                }
                this.port = port;
                this.port.onMessage.addListener((json) => {
                    debug.log(`Toolbar controller received msg: ${json.msg}, ${json}`);
                });
                this.syncActive();
            })
        }
    }

    syncActive() {
        if (!this.port) {
            return;
        }
        this.port.postMessage({
            msg: "Sync active plugins and settings",
            sync: true,
            activePlugins: [...this.activePlugins].map(p => p.getName()),
            // don't sync settings that don't do anything on the page
            activeSettings: [...this.activeSettings]
                .filter(s => s.applyToPage())
                .map(s => s.getName()),
        })
    }

    handlePluginClick(plugin) {
        if (this.activePlugins.has(plugin)) {
            this.activePlugins.delete(plugin);
        } else {
            this.activePlugins.add(plugin);
        }
        if (this.port) {
            this.port.postMessage({
                msg: "Plugin click",
                // Plugin instance will be different and not go
                // through JSON so pass the name instead.
                pluginClick: plugin.getName(),
                active: this.activePlugins.has(plugin),
            });
        }
    }

    handleSettingClick(setting) {
        if (this.activeSettings.has(setting)) {
            if (setting.applyToSidebar()) {
                setting.deactivate();
            }
            // save setting to local storage regardless of type
            browser.storage.local.set({
                [setting.getName()]: false,
            });
            this.activeSettings.delete(setting);
        } else {
            if (setting.applyToSidebar()) {
                setting.activate();
            }
            // save setting to local storage regardless of type
            browser.storage.local.set({
                [setting.getName()]: true,
            });
            this.activeSettings.add(setting);
        }
        if (!setting.applyToPage()) {
            // don't sync settings that don't do anything on the page
            return;
        }
        if (this.port) {
            this.port.postMessage({
                msg: "Setting click",
                // Settings are just identified by strings
                settingClick: setting.getName(),
                active: this.activeSettings.has(setting),
            });
        }
    }

    setWindowId(windowId) {
        this.windowId = windowId;
    }

    /**
     * Renders the toolbar and appends it to the specified element.
     */
    appendTo($el) {
        let $logo = $(logoTemplate());
        let $toolbar;

        let $plugins = buildPlugins.bind(this)(true);

        $toolbar = (
            <div id="tota11y-toolbar" className="tota11y tota11y-toolbar tota11y-expanded tota11y-sidebar"
                 role="region"
                 aria-expanded="true">
                 <a href="https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/" class="tota11y-help" target="_blank">Help</a>
                <div className="tota11y-toolbar-body">
                    {$plugins}
                </div>
            </div>
        );

        // sync the state of the local storage for settings
        // to the sidebar UI
        settings.forEach((setting) => {
            browser.storage.local.get(setting.getName()).then((storage) => {
                if (storage[setting.getName()]) {
                    setting.$checkbox.click();
                }
            })
        });

        $el.append($toolbar);
    }
}

/*
 * Plugin DOM element building logic that is common to both the Toolbar
 * and the ToolbarController
 * `this` must be bound to the Toolbar or ToolbarController respectively
 */
function buildPlugins(isSidebar) {
    let $defaultPlugins = (
        <li>
            <div className="tota11y-plugins-separator">
                Plugins
            </div>
            <ul>
                {
                    plugins.default.map((Plugin) => { // eslint-disable-line no-unused-vars
                        return (
                            <Plugin onClick={this.handlePluginClick.bind(this)} />
                        );
                    })
                }
            </ul>
        </li>
    );

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

    let $settings = (
        <li>
            <div className="tota11y-plugins-separator">
                Settings
            </div>
            <ul>
                {
                    settings
                            .filter(s => isSidebar ? true : s.applyToPage())
                            .map((Setting) => { // eslint-disable-line no-unused-vars
                        return (
                            <Setting onClick={this.handleSettingClick.bind(this)} />
                        );
                    })
                }
            </ul>
        </li>
    );

    let $plugins = (
        <ul className="tota11y-plugins">
            {$settings}
            {$defaultPlugins}
            {$experimentalPlugins}
        </ul>
    );

    return $plugins;
}

module.exports = {
   toolbar: Toolbar,
   controller: ToolbarController,
}
