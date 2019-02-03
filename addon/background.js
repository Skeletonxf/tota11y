/*
 * We use the background script to communicate with the DevTools code
 * because the background script will always be running, where as the
 * sidebar may be closed or reopened. The code here needs to always
 * be running so that no Ports that are opened or closed by the DevTools
 * code are missed, due to the need for tracking open DevTools by onConnect
 * and onDisconnect events.
 */

let openDevTools = new Map();

browser.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith("devtools-")) {
        // Extract the tabId from the port name suffix
        let tabId = parseInt(port.name.slice("devtools-".length));
        console.log(`Opened dev tools on tab: ${tabId}`);

        openDevTools.set(tabId, port);
        port.onDisconnect.addListener((port) => {
            console.log(`Closed dev tools on tab: ${tabId}`);
            openDevTools.delete(tabId);
        });
    }

    // We use the background port for communicating with the sidebar
    // code so that sidebar code does not need to determine information
    // about which DevTools are open
    if (port.name === "background") {
        port.onMessage.addListener((json) => {
            if (json.msg) {
                console.log(`Background received msg: ${json.msg}, ${json}`);
            }
            if (json.inspectMarkedElement) {
                console.log("Checking for open dev tools in active tab");
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
                    console.log("Found open dev tools in active tab");
                    // Forward on inspect instructions to only the
                    // dev tools for the active tab, using
                    // the Port that is already open
                    // and forward on the reply after the element in
                    // the page is inspected
                    let devToolsPort = openDevTools.get(activeTab.id);
                    devToolsPort.onMessage.addListener(function receiver(json) {
                        if (json.msg) {
                            console.log(`Background received msg: ${json.msg}, ${json}`);
                        }
                        if (json.inspectedElement) {
                            devToolsPort.onMessage.removeListener(receiver);
                            port.postMessage({
                                msg: json.msg,
                                inspectedElement: json.inspectedElement,
                            });
                        }
                    })
                    devToolsPort.postMessage({
                        msg: json.msg,
                        inspectMarkedElement: json.inspectMarkedElement,
                    });
                });
            }
        });
    }
});
