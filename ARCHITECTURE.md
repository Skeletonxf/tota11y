# JavaScript files that are part of this WebExtension/ browser addon run in several different places.

## The background process:
`background.js` is declared as a background script in `manifest.json` and thus runs whenever the WebExtension is active. Background scripts do not have access to the DOM. This background script does very little and just communicates with the devtools page

## DevTools page:
`devtools/index.html` and `devtools/index.js` run in the Developer Tools that can be opened or closed on a per tab basis via F12. This addon does not define any UI in the Developer Tools but does communicate with the background script.

## Sidebar page:
`sidebar/index.html` and `sidebar/index.js` run the the browser sidebar window which is per browser window, rather than tab. `sidebar/index.js` is built by Node package manager and Webpack into a file in `build/sidebar.js` which is what actually runs. `sidebar/index.js` is the human readable source code (the build folder is committed with git so the WebExtension is ready to run after cloning, but changes to `sidebar/index.js` will not automatically update `build/sidebar.js` and require `npm run dev`). The sidebar script identifies the active tab and if it is in the same window it inserts the main JavaScript file into the active tab, which is called a content script.

The sidebar also includes a `ToolbarController` and an `InfoPanelController`. The `ToolbarController` has a 1 to 1 relationship to the `Toolbar` in the content script when the addon is running. Both toolbars are defined in `toolbar.js`. The `InfoPanelController` has a 1 to many relationship with the active `InfoPanel`s in the content script. Each `InfoPanel` in the content script corresponds to 1 `ActivePanel` (active info panel) in the sidebar's `InfoPanelController`.

The sidebar also has no direct access to the DOM of the page it is opened next to.

## Content script:
Initially the only script, this is where most of `tota11y` remains and performs all the parsing of the DOM and reporting errors. It is the only JavaScript process with full access to DOM, but it has limited access to WebExtension APIs. The initial UI consisting of: annotations on the page (`plugins/shared/annotate/index.js`), the `Toolbar` to enable and disable plugins, and the `InfoPanel`s each plugin creates (`plugins/base.js`) still all run, but all the UI except the annotations (rectangles on the page) has been moved to the sidebar so as to not obscure the page. The `ToolbarController` syncs its state to the `Toolbar`, which then actually enables and disables plugins, though you can't see it anymore (other than an icon in the bottom left). The `InfoPanels` these plugins create when enabled are completely hidden, but still show all their data by sending it all over [`Port`s](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port) as JSON which goes to the `InfoPanelController` which creates an `ActivePanel` for each enabled plugin. These `ActivePanel`s then show up in the sidebar below the `ToolbarController` list of plugins to enable/disable using the same UI as `InfoPanel`s used to (minus the X button). The `ActivePanel`s continue to communicate to the content script to toggle annotations on/off and disable the plugins.

## Plugins
Defined in `plugins/*/index.js` these follow the same interface from `plugins/base.js` as when everything was running and presenting in the Web page. The plugins are actually compiled into both the content script and the sidebar script but when writing them you can ignore most of the architecture of this project because they do not communicate directly to anything except their superclass and the code in `plugins/shared`.

## A walk through using Ports
1 - The user clicks Inspect Element in an `ActivePanel` on an error reported by the Contrast plugin.
2 - This sends a JSON message over the Port between the `ActivePanel` and the its corresponding `InfoPanel`. The message includes the id given to this error
3 - The `InfoPanel` identifies the element in the DOM that corresponds to this error id. The element is marked with a special class for later use.
4 - The `InfoPanel` sends a message back to the `ActivePanel` indicating that the element in the page is marked.
5 - The `InfoPanelController` which has the same Port as the `ActivePanel` that started this chain receives the message and sends a message to the background script.
6 - The background script receives this message and has been maintaing a list of opened Developer Tools. If the Developer Tools are open for this tab it sends a message to the `devtools/index.js`.
7 - The dev tools code receives this message and runs `browser.devtools.inspectedWindow.eval("inspect(document.querySelector('.tota11y-inspected-element'))")` which identifies the marked element in the DOM and with the `inspect()` helper causes the browser to open this element in the Inspector tab of the Developer Tools.
8 - The dev tools code sends a message back to the background script indicating that it inspected the element.
9 - The background script forwards this message to the `InfoPaenlController`
10 - The `InfoPanelController` tells the `InfoPanel` to remove the mark on the element in the DOM
11 - The `InfoPanel` receives this message and removes the class from the element in the DOM that corresponded to the error.
12 - The user sees the element inspected by the browser, and possibly the brief flash as a class is added and removed from the element.

Most messages passed around with Ports between the JavaScript processes are not this complex, and most are 1 way.
