/**
 * Entry point for the sidebar to control tota11y from
 * the WebExtension.
 */
 // Require the base tota11y styles right away so they can be overwritten
require("../../less/tota11y.less");

let $ = require("jquery");

let plugins = require("../../plugins");
let toolbar = require("../../toolbar.js");

const errors = require("./errors.js");
const Lock = require("./lock.js");

const InfoPanelController = require("../../plugins/shared/info-panel/controller.js")
const ToolbarController = toolbar.controller;

const DEBUGGING = false;

let propagateError = errors.propagateError;
let windowId;

// We only need 1 of each controller for n content scripts
// and info panels
let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();

let activeTabId = -1;
let currentTabId = -1;
let insertingLock = new Lock();

function developmentTab(url) {
    if (url === "https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/") {
        return true;
    }
    return [
        "http://localhost:",
        "https://localhost",
        "file://"].some(prefix => url.startsWith(prefix));
}

// Style the body so the sidebar is always filled
$("body").css({
    "height": "auto",
    "background-color": "#333",
});

function updateSidebar(data, updateType) {
    if (insertingLock.locked()) {
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
        // Always update to stay in the active tab as long as
        // the active tab is in the same window.
        triggerUpdate = true
                && (activeTabId !== data.tabId)
                && (windowId === data.windowId);

        console.log(`Updating if active tab different ${triggerUpdate}`);

        // Update the cache of the active tab id
        activeTabId = data.tabId;
    }

    if (updateType === 'new-page') {
        // Update if a new page is loaded into the active tab
        // (ie F5).
        triggerUpdate = true
            // ignore loading of non active tabs
            && (activeTabId === data.tabId)
            // make sure this is the tab for our sidebar window
            && (windowId === data.tab.windowId)
            // ignore incomplete loading
            && (data.changeInfo.status === "complete");

        console.log(`Updating if new page loaded in active tab ${triggerUpdate}`);
    }

    if (!triggerUpdate) {
        return;
    }

    if (insertingLock.locked()) {
        console.log("Already inserting tota11y");
        return;
    }

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

        if (currentTabId === tab.id && updateType === "new-active") {
            throw new Error("Current tab id became active again, ignoring")
        }

        if (insertingLock.locked()) {
            throw new Error("Already inserting tota11y");
        }

        let executing = browser.storage.local.get("audit-dev-only")
        executing.then((storage) => {
            if (storage["audit-dev-only"]) {
                if (!developmentTab(tab.url)) {
                    throw new Error("Not development tab");
                }
            }
        }).then(() => {
            console.log(`Inserting tota11y into the page ${tab.url}`);
            console.log(`Setting lock on tab id ${tab.id}`);
            insertingLock.lock(); // will throw error if already locked

            return browser.tabs.executeScript(tab.id, {
                file: "/build/tota11y.js"
            }).then(() => {
                currentTabId = tab.id
            }).then(() => {
                insertingLock.unlock();
                console.log("Freed lock");
            }).catch(() => {
                // catch errors relating to executing the script
                // but not errors thrown deliberately in prior checks
                insertingLock.unlock();
                console.log("Error inserting, freed lock");
            });
        });

        // allow any errors thrown deliberately in prior checks to propagate
        return executing;
    })
    .catch((error) => {
        if (DEBUGGING) {
            propagateError("Executing script")(error);
        }
    });
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
