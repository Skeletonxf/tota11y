/**
 * An index of settings.
 *
 * Exposes an array of setting instances.
 */

let TranslucentAnnotations = require("./translucent-annotations");
let AuditDevOnly = require("./audit-dev-only");
let FocusOpened = require("./focus-opened");

 module.exports = [
     new TranslucentAnnotations(),
     new AuditDevOnly(),
     new FocusOpened(),
];
