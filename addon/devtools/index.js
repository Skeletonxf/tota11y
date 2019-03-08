// The inspect() helper opens the element in the developer tools inspector
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools.inspectedWindow/eval#Helpers
const inspectMarkedElement = "inspect(document.querySelector('.tota11y-inspected-element'))"

function doInspectMarkedElement() {
    browser.devtools.inspectedWindow.eval(inspectMarkedElement)
    .then((results) => {
        // element 2 of the array holds any errors
        if (results[1]) {
            console.log(
                `Error opening dev tools inspector: ${JSON.stringify(results[1])}`
            );
        }
    });
}

// Connect immediately to the background script when this file is loaded
// to track which DevTools are open, and provide the tabId in the name
let port = browser.runtime.connect({
    name: `devtools-${browser.devtools.inspectedWindow.tabId}`,
});

// Respond to the background script to inspect the marked element in the page
// and immediately reply to the background script to signal success
port.onMessage.addListener((json) => {
    if (json.msg) {
        console.log(`Devtools page ${browser.devtools.inspectedWindow.tabId} received msg: ${json.msg}, ${json}`);
    }
    if (json.inspectMarkedElement) {
        console.log("Opening marked element in dev tools inspector");
        doInspectMarkedElement();
        port.postMessage({
            msg: "Opened dev tools inspector",
            inspectedElement: true,
        });
    }
});
