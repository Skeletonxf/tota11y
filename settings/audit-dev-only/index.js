let $ = require("jquery");
let Setting = require("../base");

/*
 * The audit-dev-only is automatically synced with
 * the browser.storage.local area as the setting value
 * itself is what we check in the sidebar code.
 */
class AuditDevOnly extends Setting {
    getName() {
        return "audit-dev-only";
    }

    getDescription() {
        return "Audit localhost:// and file:// tabs only";
    }

    applyToSidebar() {
        return true;
    }

    applyToPage() {
        return false;
    }

    enable() {
        // TODO notify the sidebar code to insert tota11y if the
        // active tab was non localhost or file and we didn't insert
    }

    disable() {
        // TODO notify the sidebar code to remove tota11y if
        // the active tab is non localhost or file and we already inserted
    }
}

module.exports = AuditDevOnly;
