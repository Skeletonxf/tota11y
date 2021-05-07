/*
 * A setting that configures the behaviour of the addon or bookmarklet
 * in some way.
 * This module defines methods to render settings in a similar style to plugins
 * Each plugin will define five methods:
 *     getName: name to use for messaging to communicate to sidebar
 *     getDescription: description to display in the toolbar
 *     applyToSidebar: indicates this setting should be applied to the sidebar
 *     applyToPage: indicates this setting should be applied to the page
 *     enable: turns on this setting
 *     disable: turns off this setting
 */

class Setting {
    constructor() {
        this.$checkbox = null;
    }

    getName() {
        return getDescription().replace(" ", "-").toLowerCase();
    }

    getDescription() {
        return "";
    }

    applyToSidebar() {
        return false;
    }

    applyToPage() {
        return false;
    }

    render(clickHandler) {
        this.$checkbox = (
            <input
                className="tota11y-setting-checkbox tota11y-sr-only"
                type="checkbox"
                onClick={() => clickHandler(this)} />
        );

        let $switch = (
            <label className="tota11y-setting-switch">
                {this.$checkbox}
                <div aria-hidden="true"
                     className="tota11y-setting-indicator">
                    &#x2713;
                </div>
                <div className="tota11y-setting-info-setting">
                        {this.getDescription()}
                </div>
            </label>
        );

        let $el = (
            <li role="menuitem" className="tota11y-setting">
                {$switch}
            </li>
        );

        return $el;
    }

    enable() {
    }

    disable() {
    }

    activate() {
        this.enable();
    }

    deactivate() {
        this.disable();
    }

    enabledByDefault() {
        return false;
    }
}

module.exports = Setting
