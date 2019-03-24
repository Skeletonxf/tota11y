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

const INIT_PORT = "init";

const debug = require("../../utils/debugging.js");
const DEBUGGING = false; // FIXME

let propagateError = errors.propagateError;
let windowId;

// We only need 1 of each controller for n content scripts
// and info panels
let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();

/*
 * Cached ids for insert logic to avoid inserting the content script
 * when it is already in the page.
 */
let activeTabId = -1;
let activeTabWindowId = -1;
let currentTabId = -1;

let insertingLock = new Lock();

function isDevTab(url) {
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
        return;
    }

    let triggerUpdate = false;

    if (updateType === "first-load") {
        // Always update if just loaded or switched window focus
        triggerUpdate = true;
    }

    if (updateType === "new-active") {
        // Always update to stay in the active tab as long as
        // the active tab is in the same window.
        triggerUpdate = true
                && (activeTabId !== data.tabId)
                && (windowId === data.windowId);

        console.log(`Updating if active tab different ${triggerUpdate}`);
    }

    if (updateType === 'new-page') {
        // Update if a new page is loaded into the active tab
        // (ie F5).
        triggerUpdate = true
            // ignore loading of non active tabs
            && ((activeTabId === data.tabId))
            // make sure this is the tab for our sidebar window
            && (windowId === data.tab.windowId)
            // ignore incomplete loading
            && (data.changeInfo.status === "complete");

        console.log(`Updating if new page loaded in active tab ${triggerUpdate}`);
    }

    // Update the cache of the active tab and window ids
    activeTabId = data.tabId;

    if (!triggerUpdate) {
        return;
    }

    if (insertingLock.locked()) {
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
                if (!isDevTab(tab.url)) {
                    throw new Error("Not development tab");
                }
            }
        }).then(() => {
            console.log(`Inserting totally into the page ${tab.url}`);
            insertingLock.lock(); // will throw error if already locked

            return browser.tabs.executeScript(tab.id, {
                file: "/build/tota11y.js"
            }).then(() => {
                currentTabId = tab.id
                // We need to tell the content script which window it is in
                // so it can talk to the correct sidebar
                let port = browser.tabs.connect(tab.id, {
                    name: INIT_PORT
                });
                port.postMessage({
                    msg: "Init",
                    windowId: windowId,
                });
            }).then(() => {
                insertingLock.unlock();
            }).catch(() => {
                // catch errors relating to executing the script
                // but not errors thrown deliberately in prior checks
                insertingLock.unlock();
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
        windowId: tab.windowId,
        changeInfo: changeInfo,
        tab: tab,
    }, "new-page");
}, {
    properties: ["status"] // filter everything but change in status
});

/*
 * Cache for tracking the most recentely focused window, excluding
 * non browser windows, and not dependent on this sidebar inserting the
 * content script into any window.
 */
// let mostRecentWindowId = -1;

// /*
//  * Update content when we switch window focus.
//  */
// browser.windows.onFocusChanged.addListener((newWindowId) => {
//     if ((windowId === newWindowId) && (mostRecentWindowId !== windowId)) {
//         browser.tabs.query({windowId: windowId, active: true})
//         .then((tabs) => {
//             updateSidebar({
//                 tabId: tabs[0].id,
//                 windowId: newWindowId,
//             }, "new-window");
//         }).catch(propagateError("Querying active tab for window focus switch"))
//     }
//     if (newWindowId !== browser.windows.WINDOW_ID_NONE) {
//         mostRecentWindowId = newWindowId;
//     }
// });

/*
 * When the sidebar loads, get the ID of its window,
 * and update its content.
 */
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
    windowId = windowInfo.id;
    // mostRecentWindowId = windowId;
    toolbarController.setWindowId(windowId);
    infoPanelController.setWindowId(windowId);

    console.log(`Sidebar for window: ${windowId} loaded`);
    browser.tabs.query({windowId: windowId, active: true})
    .then((tabs) => {
        updateSidebar({
            tabId: tabs[0].id,
            windowId: windowId,
        }, "first-load");
    }).catch(propagateError("Querying active tab for window focus switch"))
});
