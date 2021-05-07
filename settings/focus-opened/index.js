let $ = require("jquery");
let Setting = require("../base");

/*
 * The focus-opened is automatically synced with
 * the browser.storage.local area as the setting value
 * itself is what we check in the sidebar code.
 */
class FocusOpened extends Setting {
    getName() {
        return "focus-opened";
    }

    getDescription() {
        return "Shift focus to newly opened plugins";
    }

    applyToSidebar() {
        return true;
    }

    applyToPage() {
        return false;
    }

    enable() {
    }

    disable() {
    }

    enabledByDefault() {
        return true;
    }
}

module.exports = FocusOpened;
