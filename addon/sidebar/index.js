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
 * a custom message.
 * The message should be unique so the line that
 * caused it can be identified.
 */
function onError(msg) {
    return (error) => console.log(`Error: ${error}, at: ${msg}`);
}

// developed using https://github.com/mdn/webextensions-examples

// We only need 1 controller for n content scripts
let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();

let activeTabInfo = {
    id: null,
    url: null,
    status: "complete"
};

/*
 * Update the sidebar for this active tab
 */
function updateContent(tabId, changeInfo, tabInfo) {
    console.log("Updating content");
    browser.tabs.query({windowId: windowId, active: true})
    .then((tabs) => {
        return tabs[0];
    })
    .then((tab) => {
        if (tabId && (tabId !== tab.id)) {
            console.log("Different tab updated, not active tab, ignoring");
            return;
        }

        if (tabInfo) {
            if ((tabInfo.id === activeTabInfo.id)
                    && (tabInfo.url === activeTabInfo.url)
                    && (tabInfo.status === activeTabInfo.status)) {
                console.log("Active tab and url unchanged, ignoring");
                return;
            }
            activeTabInfo.id = tabInfo.id;
            activeTabInfo.url = tabInfo.url;
            // We want to reapply tota11y if a tab is refreshed
            // in which case its id and url will not change but
            // its status will go to "loading" before back to
            // "complete"
            activeTabInfo.status = tabInfo.status
        }

        if (tabInfo && (tabInfo.status === "loading")) {
            console.log("Tab is still loading, waiting till complete");
            return;
        }

        if (tabInfo) {
            console.log("Tab info:");
            for (let property in tabInfo) {
                console.log(`${property} ${tabInfo[property]}`);
            }
        }

        // if (tab.id !== tabContent.id) {
        //     console.log("Active tab id changed");
        // }

        // if ((tabContent.id === tab.id) && (tabContent.url === tab.url)) {
        //     console.log("Same tab as before, checking if loading");
        //     if (changeInfo && changeInfo.status) {
        //         if (changeInfo.status !== activeTabContent.status) {
        //
        //         }
        //     }
        // }

        // tabContent.id = tab.id;
        // tabContent.url = tab.url;
        // if (changeInfo && changeInfo.status) {
        //     tabContent.status = status;
        // }
        console.log(`Inserting tota11y into the page ${tab.url}`);
        browser.tabs.executeScript(tab.id, {
            file: "/build/tota11y.js"
        }).catch(onError("failed to execute script"));
    }).catch(onError("failed to query tabs"));
}

/*
Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
    windowId = windowInfo.id;
    updateContent();
});
