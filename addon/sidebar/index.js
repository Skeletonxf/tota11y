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
        console.error(`Error: ${error}, at: ${msg}`);
        throw error;
    };
}

// We only need 1 of each controller for n content scripts
// and info panels
let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();

let activeTabId = -1;
let insertingTabIdLock = -1;
async function updateSidebar(data, updateType) {
    if (insertingTabIdLock !== -1) {
        console.log("Already inserting tota11y");
        return;
    }

    let triggerUpdate = false;

    if (updateType === "first-load") {
        // Always update if just loaded.
        console.log("Just loaded, going to update sidebar");
        triggerUpdate = true;
    }

    if (updateType === "new-active") {
        // Always update to stay in the active tab.
        triggerUpdate = activeTabId !== data.tabId;
        console.log(`Updating if active tab is different from previous ${triggerUpdate}`);

        activeTabId = data.tabId;
    }

    if (updateType === 'new-page') {
        // Update if a new page is loaded into the active tab
        // (ie F5).
        triggerUpdate = true
            // ignore loading of non active tabs
            && (activeTabId === data.tabId)
            // ignore incomplete loading
            && (data.changeInfo.status === "complete");

        if (triggerUpdate) {
            let scriptTabId = await toolbarController.getTabId();
            if ((scriptTabId) && (scriptTabId === activeTabId)) {
                console.log("Still tota11y script in active tab, ignoring");
                triggerUpdate = false;
            } else {
                console.log("No tota11y script identified in active tab");
            }
        }

        console.log(`Updating if new page loaded into active tab ${triggerUpdate}`);
        if (triggerUpdate) {
            console.log(`Change info: ${JSON.stringify(data.changeInfo)}`);
        }
    }

    if (insertingTabIdLock !== -1) {
        console.log("Already inserting tota11y");
        triggerUpdate = false;
    }

    if (!triggerUpdate) {
        console.log(`Ignoring update, activeTabId: ${activeTabId}`);
        return;
    }

    console.log("Going to insert tota11y into the page");
    browser.tabs.query({windowId: windowId, active: true})
    .then((tabs) => {
        return tabs[0];
    })
    .catch(propagateError("Querying active tab"))
    .then((tab) => {
        if ((tab.url.startsWith("about"))
                || (tab.url.startsWith("view-source"))) {
            throw new Error(`${tab.url} ignored, cannot inject tota11y`);
        }

        if (insertingTabIdLock !== -1) {
            throw new Error("Already inserting tota11y");
        }

        console.log(`Inserting tota11y into the page ${tab.url}, tab id: ${tab.id}`);
        console.log(`Setting lock on tab id ${tab.id}`);
        insertingTabIdLock = tab.id;

        let executing = browser.tabs.executeScript(tab.id, {
            file: "/build/tota11y.js"
        });
        executing.then(() => {
            console.log(`Sending tab id ${tab.id} to tota11y script`)
            toolbarController.sendTabId(tab.id);
        });
        return executing;
    })
    .then(() => {
        console.log("Executed script");
        insertingTabIdLock = -1;
        console.log("Freed lock on inserting");
    })
    .catch(propagateError("Executing script"));
}

/*
 * Update content when a new tab becomes active.
 */
browser.tabs.onActivated.addListener((activeInfo) => {
    updateSidebar({
        tabId: activeInfo.tabId,
        windowId: activeInfo.windowId,
    }, "new-active");
});

/*
 * Update content when a new page is loaded into a tab.
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    updateSidebar({
        tabId: tabId,
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
