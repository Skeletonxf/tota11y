let $ = require("jquery");
let Plugin = require("../base");

class AuditDevOnly extends Plugin {
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
        // TODO
    }

    disable() {
        // TODO
    }
}

module.exports = AuditDevOnly;
