/*
 * We use the background script to communicate with the DevTools code
 * because the background script will always be running, where as the
 * sidebar may be closed or reopened. The code here needs to always
 * be running so that no Ports that are opened or closed by the DevTools
 * code are missed, due to the need for tracking open DevTools by onConnect
 * and onDisconnect events.
 */

let openDevTools = new Map();

let backgroundPort;

// No imports for this file because Webpack doesn't build it
const DEBUGGING = false;
let debug = null;
if (DEBUGGING) {
    debug = {
        log: (message) => console.log(message),
        error: (message) => console.error(message),
    }
} else {
    debug = {
        log: (message) => null,
        error: (message) => null,
    }
}

function notifyActiveDevTools() {
    if (backgroundPort) {
        browser.tabs.query({
            active: true,
            currentWindow: true,
        }).then((tabs) => {
            let activeTab = tabs[0];
            backgroundPort.postMessage({
                devToolsStatus: true,
                isActive: openDevTools.has(activeTab.id),
            });
        });
    }
}

browser.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith("devtools-")) {
        // Extract the tabId from the port name suffix
        let tabId = parseInt(port.name.slice("devtools-".length));

        openDevTools.set(tabId, port);
        notifyActiveDevTools();
        port.onDisconnect.addListener((port) => {
            openDevTools.delete(tabId);
            notifyActiveDevTools();
        });
    }

    // We use the background port for communicating with the sidebar
    // code so that sidebar code does not need to determine information
    // about which DevTools are open
    if (port.name === "background") {
        backgroundPort = port;
        notifyActiveDevTools();

        port.onMessage.addListener((json) => {
            if (json.msg) {
                debug.log(`Background received msg: ${json.msg}, ${json}`);
            }
            if (json.inspectMarkedElement) {
                browser.tabs.query({
                    active: true,
                    currentWindow: true,
                }).then((tabs) => {
                    let activeTab = tabs[0];
                    if (!openDevTools.has(activeTab.id)) {
                        port.postMessage({
                            msg: "No open dev tools in active tab",
                            failed: true,
                        });
                        return;
                    }
                    // Forward on inspect instructions to only the
                    // dev tools for the active tab, using
                    // the Port that is already open
                    // and forward on the reply after the element in
                    // the page is inspected
                    let devToolsPort = openDevTools.get(activeTab.id);
                    devToolsPort.onMessage.addListener(function receiver(json) {
                        if (json.msg) {
                            debug.log(`Background received msg: ${json.msg}, ${json}`);
                        }
                        if (json.inspectedElement) {
                            devToolsPort.onMessage.removeListener(receiver);
                            port.postMessage({
                                msg: json.msg,
                                inspectedElement: json.inspectedElement,
                            });
                        }
                    });
                    devToolsPort.postMessage({
                        msg: json.msg,
                        inspectMarkedElement: json.inspectMarkedElement,
                    });
                });
            }
        });
    }
});

// Onboard new users with the help page
browser.runtime.onInstalled.addListener((details) => {
    if (details.temporary) {
        return;
    }
    if (details.reason === "install") {
        browser.tabs.create({
            url: "https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/"
        }).then((tab) => {
            debug.log('Opened onboarding help page');
        }).catch((error) => {
            debug.error(`Error opening help page: ${error}`);
        })
    }
});
