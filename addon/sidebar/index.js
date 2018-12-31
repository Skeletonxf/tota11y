/**
 * Entry point for the sidebar to control tota11y from
 * the WebExtension.
 */
 // Require the base tota11y styles right away so they can be overwritten
require("../../less/tota11y.less");

let $ = require("jquery");

let plugins = require("../../plugins");
let toolbar = require("../../toolbar.js");

const InfoPanelController = require("../../plugins/shared/info-panel/controller.js")
const ToolbarController = toolbar.controller;

let windowId;

/*
 * Generates a function which logs an error with
 * a custom message, then propagates the error
 *
 * The message should be unique so the line that
 * caused it can be identified.
 */
function propagateError(msg) {
    return (error) => {
        console.log(`Error: ${error}, at: ${msg}`);
        throw error;
    };
}

// We only need 1 of each controller for n content scripts
// and info panels
let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();

let activeTabId = -1;
function updateSidebar(data, updateType) {
    let triggerUpdate = false;

    if (updateType === "first-load") {
        // Always update if just loaded.
        console.log("Just loaded, going to update sidebar");
        triggerUpdate = true;
    }

    if (updateType === "new-active") {
        // Always update to stay in the active tab.
        console.log(`Updating if active tab is different from previous ${activeTabId !== data.tabId}`);
        triggerUpdate = activeTabId !== data.tabId;

        console.log("Updating active tab id cache");
        activeTabId = data.tabId;
    }

    if (updateType === 'new-page') {
        // Update if a new page is loaded into the active tab
        // (ie F5).
        console.log(`Updating if new page is loaded into the active tab ${activeTabId === data.tabId}, ${data.tabId}`);
        triggerUpdate = activeTabId === data.tabId;
    }

    if (!triggerUpdate) {
        console.log(`Ignoring update, activeTabId: ${activeTabId}`);
        return;
    }

    browser.tabs.query({windowId: windowId, active: true})
    .then((tabs) => {
        console.log("Got active tab");
        return tabs[0];
    })
    .catch(propagateError("Querying active tab"))
    .then((tab) => {
        // console.log(`Active tab id is now: ${tab.id}`);
        // activeTabId = tab.id;

        console.log(`Inserting tota11y into the page ${tab.url}, tab id: ${tab.id}`);
        return browser.tabs.executeScript(tab.id, {
            file: "/build/tota11y.js"
        });
    })
    .then(() => console.log("Executed script"))
    .catch(propagateError("Executing script"));
}

/*
 * Update content when a new tab becomes active.
 */
browser.tabs.onActivated.addListener((tabId, windowId) => {
    updateSidebar({
        tabId: tabId,
        windowId: windowId,
    }, "new-active");
});

/*
 * Update content when a new page is loaded into a tab.
 */
browser.tabs.onUpdated.addListener((tabInfo, changeInfo, tab) => {
    updateSidebar({
        tabId: tabId, // FIXME this doesn't seem to be an integer
        changeInfo: changeInfo,
        tab: tab
    }, "new-page");
}, {
    properties: ["status"] // filter everything but change in status
});

/*
 * When the sidebar loads, get the ID of its window,
 * and update its content.
 */
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
    windowId = windowInfo.id;
    updateSidebar({}, "first-load");
});
