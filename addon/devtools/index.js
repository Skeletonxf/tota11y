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

browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "devtools") {
        return;
    }
    port.onMessage.addListener((json) => {
        if (json.msg) {
            console.log(`Devtools page received msg: ${json.msg}, ${json}`);
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
});
