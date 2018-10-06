/**
 * The entry point for tota11y.
 *
 * Builds and mounts the toolbar.
 */

// Require the base tota11y styles right away so they can be overwritten
require("./less/tota11y.less");

let $ = require("jquery");

let plugins = require("./plugins");
let logoTemplate = require("./templates/logo.handlebars");

// Chrome Accessibility Developer Tools - required once as a global
require("script-loader!./node_modules/accessibility-developer-tools/dist/js/axs_testing.js");

class Toolbar {
    constructor() {
        this.activePlugin = null;
    }

    /**
     * Manages the state of the toolbar when a plugin is clicked, and toggles
     * the appropriate plugins on and off.
     */
    handlePluginClick(plugin) {
        // If the plugin was already selected, toggle it off
        if (plugin === this.activePlugin) {
            plugin.deactivate();
            this.activePlugin = null;
        } else {
            // Deactivate the active plugin if there is one
            if (this.activePlugin) {
                this.activePlugin.deactivate();
            }

            // Activate the selected plugin
            plugin.activate();
            this.activePlugin = plugin;
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
    }
}

$(function() {
    var bar = new Toolbar();

    // TODO New file
    console.log("going to open port to sidebar");
    console.log(browser);
    let port = browser.runtime.connect({name:"content-script"});
    port.postMessage({toolbar: bar, greeting:"passing toolbar instance"});

    let allPlugins = plugins.default.concat(plugins.experimental)
    let namedPlugins = allPlugins.map((p) => p.getName());

    port.onMessage.addListener(function(m) {
        console.log("In content script, received message from background script: ");
        console.log(m.greeting);
        if (m.pluginClick) {
            let index = namedPlugins.findIndex((p) => p === m.pluginClick);
            if (index !== -1) {
                // toolbar expects plugin instance
                bar.handlePluginClick(allPlugins[index]);
                console.log("handled through port");
            } else {
                console.log("unrecognised");
                console.log("plugins", namedPlugins, m.pluginClick);
            }
        }
    });

    // TODO: Make this customizable
    bar.appendTo($("body"));
});
