/**
 * A plugin to identify malformed tables
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("tables");
let audit = require("../shared/audit");

let errorTemplate = require("./error-template.handlebars");

class TablesPlugin extends Plugin {
    getName() {
        return "table-headers";
    }

    getTitle() {
        return "Tables";
    }

    getDescription() {
        return "Identifies tables with markup problems";
    }

    errorMessage($el, presentation, noHeadings, tooManyHeads,
            headInData, dataInHead, data) {
        return errorTemplate({
            id: $el.attr("id"),
            presentation: presentation,
            noHeadings: noHeadings,
            tooManyHeads: tooManyHeads,
            headInData: headInData,
            dataInHead: dataInHead,
            data: data,
            tagName: $el.prop("tagName").toLowerCase(),
        });
    }

    run() {
        let elements = $("table");
        let _this = this;

        if (elements.length > 0) {
            elements.each(function(index) {
                let $el = $(this);

                let data = {
                    presentational: $el.attr("role") === "presentation",
                    noHeadings: $el.find("th").length === 0,
                    heads: $el.find("thead").length,
                    tableBodys: $el.children("tbody").length > 0,
                    rootTableRows: $el.children("tr").length > 0,
                }

                let presentation = data.presentational && !data.noHeadings;
                let noHeadings = !data.presentational && data.noHeadings;
                let tooManyHeads = data.heads > 1;

                let dataInHead = false;
                let headInData = false;

                let problems = 0;

                let title = "Table has problem(s) with its markup";
                if (tooManyHeads) {
                    title = "Table has too many &lt;thead&gt;s";
                    problems += 1;
                }
                if (presentation) {
                    title = "Presentational table should not have headers";
                    problems += 1;
                }
                if (noHeadings) {
                    title = "Table is missing headers";
                    problems += 1;
                }

                // Only scan into table markup for more complex
                // problems if there are not more simpler ones that
                // this might be confusing to see listed with.
                if (!noHeadings && !presentation) {
                    let $tableHead = $el.children("thead");
                    if ($tableHead.length === 0) {
                        let $rows;
                        let $tableBody = $el.children('tbody');
                        if ($tableBody.length === 0) {
                            $rows = $el.children('tr');
                        } else {
                            $rows = $tableBody.children("tr");
                        }
                        let $firstRow = $rows.first();
                        if (($tableBody.length > 0)
                                && ($firstRow.children("th").length > 0)
                                && ($firstRow.children("td").length === 0)) {
                            title = "First table body is a table head";
                            headInData = true;
                            problems += 1;
                        }
                    } else {
                        if ($tableHead.children("td")) {
                            title = "Table head contains data cells";
                            dataInHead = true;
                            problems += 1;
                        }
                    }
                }

                if (problems > 1) {
                    title = "Table has problem(s) with its markup";
                }

                // if (false) {
                //     // Retrieve the table rows, which may be
                //     // inside <tbody> elements or directly
                //     // inside the <table> element but only
                //     // one of the two.
                //     let tableBody = $el.children('tbody');
                //     let rows;
                //     if (tableBody.length === 0) {
                //         rows = $el.children('tr');
                //     } else {
                //         rows = tableBody.children("tr");
                //     }
                //
                //     // Determine the table head(s)
                //     // There can only be at most one thead but there
                //     // may also be headers in table rows.
                //     let tableHeads = [ $el.children('thead') ];
                //     rows.each(function(index) {
                //         let hasHeaders = $(this).children('th').length > 0;
                //         let hasData = $(this).children('td').length > 0;
                //         if ((index === 0)
                //                 && hasHeaders
                //                 && !hasData
                //                 && (tableHeads[0].length === 0)) {
                //             // assume the first table row is the header
                //             tableHeads[0] = $(this);
                //         } else if (hasHeaders) {
                //             // table has headers on the rows somewhere
                //             tableHeads.push($(this));
                //         }
                //     });
                // }

                if (problems > 0) {
                    // Place an error label on the element and register it as an
                    // error in the info panel
                    let entry = _this.error(title, $(
                            _this.errorMessage($el,
                                presentation,
                                noHeadings,
                                tooManyHeads,
                                headInData,
                                dataInHead,
                                data
                            )
                        ), $el
                    );
                    annotate.errorLabel($el, "", title, entry);
                }
            });
        }
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = TablesPlugin;
