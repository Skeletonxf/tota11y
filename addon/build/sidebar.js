/*!
 * Totally Automated Accessibility Scanner
 * 
 * Totally v1.1.6
 * 
 * Forked from tota11y v0.1.6
 * http://khan.github.io/tota11y
 * 
 * tota11y Copyright (c) 2015 Khan Academy
 * Released under the MIT license
 * http://github.com/Khan/tota11y/blob/master/LICENSE.txt
 * 
 * Includes Accessibility Developer Tools
 * http://github.com/GoogleChrome/accessibility-developer-tools
 * 
 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./addon/sidebar/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./addon/sidebar/errors.js":
/*!*********************************!*\
  !*** ./addon/sidebar/errors.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
 * Generates a function which logs an error with
 * a custom message, then propagates the error
 *
 * The message should be unique so the line that
 * caused it can be identified.
 */
function propagateError(msg) {
  return error => {
    console.error(`Error: ${error}, at: ${msg}`);
    throw error;
  };
}

module.exports = {
  propagateError: propagateError
};

/***/ }),

/***/ "./addon/sidebar/index.js":
/*!********************************!*\
  !*** ./addon/sidebar/index.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Entry point for the sidebar to control tota11y from
 * the WebExtension.
 */
// Require the base tota11y styles right away so they can be overwritten
__webpack_require__(/*! ../../less/tota11y.less */ "./less/tota11y.less");

__webpack_require__(/*! ./style.less */ "./addon/sidebar/style.less");

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let plugins = __webpack_require__(/*! ../../plugins */ "./plugins/index.js");

let toolbar = __webpack_require__(/*! ../../toolbar.js */ "./toolbar.js");

const errors = __webpack_require__(/*! ./errors.js */ "./addon/sidebar/errors.js");

const Lock = __webpack_require__(/*! ./lock.js */ "./addon/sidebar/lock.js");

const InfoPanelController = __webpack_require__(/*! ../../plugins/shared/info-panel/controller.js */ "./plugins/shared/info-panel/controller.js");

const ToolbarController = toolbar.controller;
const INIT_PORT = "init";

const debug = __webpack_require__(/*! ../../utils/debugging.js */ "./utils/debugging.js");

let propagateError = errors.propagateError;
let windowId; // We only need 1 of each controller for n content scripts
// and info panels

let toolbarController = new ToolbarController();
toolbarController.appendTo($("body"));
let infoPanelController = new InfoPanelController();
/*
 * Cached ids for insert logic to avoid inserting the content script
 * when it is already in the page.
 */

let activeTabId = -1;
let currentTabId = -1;
let insertingLock = new Lock();

function isDevTab(url) {
  if (url === "https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/") {
    return true;
  }

  return ["http://localhost:", "https://localhost", "file://"].some(prefix => url.startsWith(prefix));
}

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
    triggerUpdate =  true && activeTabId !== data.tabId && windowId === data.windowId;
    debug.log(`Updating if active tab different ${triggerUpdate}`);
  }

  if (updateType === 'new-page') {
    // Update if a new page is loaded into the active tab
    // (ie F5).
    triggerUpdate =  true // ignore loading of non active tabs
    && activeTabId === data.tabId // make sure this is the tab for our sidebar window
    && windowId === data.tab.windowId // ignore incomplete loading
    && data.changeInfo.status === "complete";
    debug.log(`Updating if new page loaded in active tab ${triggerUpdate}`);
  } // Update the cache of the active tab and window ids


  activeTabId = data.tabId;

  if (!triggerUpdate) {
    return;
  }

  if (insertingLock.locked()) {
    return;
  }

  browser.tabs.query({
    windowId: windowId,
    active: true
  }).then(tabs => {
    return tabs[0];
  }).catch(propagateError("Querying active tab")).then(tab => {
    if (tab.url.startsWith("about") || tab.url.startsWith("view-source")) {
      throw new Error(`${tab.url} ignored, cannot inject tota11y`);
    }

    if (currentTabId === tab.id && updateType === "new-active") {
      throw new Error("Current tab id became active again, ignoring");
    }

    if (insertingLock.locked()) {
      throw new Error("Already inserting tota11y");
    }

    let executing = browser.storage.local.get("audit-dev-only");
    executing.then(storage => {
      if (storage["audit-dev-only"]) {
        if (!isDevTab(tab.url)) {
          throw new Error("Not development tab");
        }
      }
    }).then(() => {
      debug.log(`Inserting totally into the page ${tab.url}`);
      insertingLock.lock(); // will throw error if already locked

      return browser.tabs.executeScript(tab.id, {
        file: "/build/tota11y.js"
      }).then(() => {
        currentTabId = tab.id;
        let tries = 3;
        let success = false; // We need to tell the content script which window it is in
        // so it can talk to the correct sidebar

        let giveWindowId = () => {
          let port = browser.tabs.connect(tab.id, {
            name: INIT_PORT
          });
          port.onMessage.addListener(json => {
            if (json.getWindowId) {
              port.postMessage({
                msg: "Window id for initialisation",
                windowId: windowId
              });
              success = true;
            }
          });
          port.onDisconnect.addListener(port => {
            // HACK: Ports will close automatically if there are
            // no listeners which can happen due to the content
            // script not immediately adding a listener to
            // this connection. We try multiple times for a
            // successful connection to ensure that we connect
            // if the content script is trying to listen.
            if (tries > 0 && !success) {
              tries -= 1;
              giveWindowId();
            }
          });
        };

        giveWindowId();
      }).then(() => {
        insertingLock.unlock();
      }).catch(error => {
        // catch errors relating to executing the script
        // but not errors thrown deliberately in prior checks
        insertingLock.unlock();
      });
    }).catch(error => {// don't want to print these errors because we deliberately throw
      // them
    }); // allow any errors thrown deliberately in prior checks to propagate

    return executing;
  }).catch(error => {// don't want to print these errors because we deliberately throw them
  });
}
/*
 * Update content when a new tab becomes active.
 */


browser.tabs.onActivated.addListener(activeInfo => {
  updateSidebar({
    tabId: activeInfo.tabId,
    windowId: activeInfo.windowId
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
    tab: tab
  }, "new-page");
}, {
  properties: ["status"] // filter everything but change in status

});
/*
 * When the sidebar loads, get the ID of its window,
 * and update its content.
 */

browser.windows.getCurrent({
  populate: true
}).then(windowInfo => {
  windowId = windowInfo.id;
  toolbarController.setWindowId(windowId);
  infoPanelController.setWindowId(windowId);
  debug.log(`Sidebar for window: ${windowId} loaded`);
  browser.tabs.query({
    windowId: windowId,
    active: true
  }).then(tabs => {
    updateSidebar({
      tabId: tabs[0].id,
      windowId: windowId
    }, "first-load");
  }).catch(propagateError("Querying active tab for window focus switch"));
});

/***/ }),

/***/ "./addon/sidebar/lock.js":
/*!*******************************!*\
  !*** ./addon/sidebar/lock.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
 * A simple Lock class.
 *
 * JS is single threaded so this is a rare need, but
 * the chain of then's in the event listeners to page and tab
 * updates take several JS loops to complete, and during this
 * time the listeners can be fired again, causing concurrency
 * problems.
 */
class Lock {
  constructor() {
    this._locked = false;
  }

  lock() {
    if (!this._locked) {
      this._locked = true;
    } else {
      throw new Error("Already locked");
    }
  }

  locked() {
    return this._locked;
  }

  unlock() {
    this._locked = false;
  }

}

module.exports = Lock;

/***/ }),

/***/ "./addon/sidebar/style.less":
/*!**********************************!*\
  !*** ./addon/sidebar/style.less ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/postcss-loader/src??postcss!../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./addon/sidebar/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./less/tota11y.less":
/*!***************************!*\
  !*** ./less/tota11y.less ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../node_modules/css-loader!../node_modules/postcss-loader/src??postcss!../node_modules/less-loader/dist/cjs.js!./tota11y.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./less/tota11y.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./addon/sidebar/style.less":
/*!**********************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./addon/sidebar/style.less ***!
  \**********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\nbody {\n  height: auto !important;\n  background-color: #333 !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./less/tota11y.less":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./less/tota11y.less ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n/**\n * Base styles for tota11y to make sure things look consistent under\n * reasonable circumstances.\n */\n.tota11y,\n.tota11y * {\n  border: none !important;\n  background-color: inherit !important;\n  box-sizing: border-box !important;\n  color: #f2f2f2 !important;\n  font-family: Arial !important;\n  font-size: 14px !important;\n  font-style: normal !important;\n  font-weight: 400 !important;\n  line-height: 1.35 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n  text-align: left !important;\n  text-shadow: none !important;\n}\n.tota11y * {\n  height: auto !important;\n  width: auto !important;\n}\n.tota11y strong {\n  font-weight: bold !important;\n}\n.tota11y pre,\n.tota11y code {\n  background-color: #ddd !important;\n  border: none !important;\n  border-radius: 0 !important;\n  color: inherit !important;\n  font-family: monospace !important;\n  font-size: inherit !important;\n  line-height: inherit !important;\n}\n.tota11y pre {\n  padding: 5px 10px !important;\n  margin: 0 0 10px !important;\n  overflow-x: scroll !important;\n}\n.tota11y code {\n  border-radius: 2px !important;\n  display: inline !important;\n  padding: 1px !important;\n}\n.tota11y i,\n.tota11y em {\n  font-style: italic !important;\n}\n.tota11y p {\n  margin: 0 0 10px !important;\n}\n.tota11y a,\n.tota11y a:hover,\n.tota11y a:focus {\n  background-color: inherit !important;\n  color: inherit !important;\n  text-decoration: none !important;\n}\n.tota11y-toolbar {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n  position: fixed !important;\n  top: auto !important;\n  right: auto !important;\n  bottom: 0 !important;\n  left: 10px !important;\n  border-top-left-radius: 5px !important;\n  border-top-right-radius: 5px !important;\n  overflow: hidden !important;\n  z-index: 9998 !important;\n}\n.tota11y-toolbar-toggle {\n  background-color: #333 !important;\n  display: block !important;\n  padding: 7px !important;\n  width: 100% !important;\n}\n.tota11y-toolbar-logo {\n  height: 25px !important;\n  margin: 0 auto !important;\n  text-align: center !important;\n  width: 35px !important;\n}\n.tota11y-toolbar-logo svg {\n  height: 25px !important;\n}\n.tota11y-toolbar-body {\n  display: none !important;\n}\n.tota11y-toolbar.tota11y-expanded .tota11y-toolbar-body {\n  display: block !important;\n}\n.tota11y-sr-only {\n  border: 0 !important;\n  clip: rect(0, 0, 0, 0) !important;\n  height: 1px !important;\n  margin: -1px !important;\n  overflow: hidden !important;\n  padding: 0 !important;\n  position: absolute !important;\n  width: 1px !important;\n}\n.tota11y-sidebar {\n  position: static !important;\n}\n.tota11y-sidebar .tota11y-plugin-description,\n.tota11y-sidebar .tota11y-setting-description {\n  width: auto !important;\n}\n.tota11y-sidebar .tota11y-plugin-indicator,\n.tota11y-sidebar .tota11y-setting-indicator {\n  margin: 0 10px !important;\n}\n.tota11y-sidebar .tota11y-plugin-switch,\n.tota11y-sidebar .tota11y-setting-switch {\n  padding: 9px 9px 9px 0 !important;\n}\n.tota11y-sidebar .tota11y-help {\n  position: absolute !important;\n  right: 10px !important;\n  top: 5px !important;\n}\n.tota11y-sidebar .tota11y-info-title:hover {\n  cursor: default !important;\n}\n.tota11y-sidebar.tota11y-toolbar {\n  border-top-left-radius: 0 !important;\n  border-top-right-radius: 0 !important;\n}\n.tota11y-disabled-toolbar {\n  pointer-events: none !important;\n  opacity: 0.5 !important;\n}\n.tota11y.tota11y-info.tota11y-sidebar:nth-child(2n+1) {\n  background-color: #4A5837 !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-name/style.less":
/*!**************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-name/style.less ***!
  \**************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, "", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-text-wand/style.less":
/*!*******************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-text-wand/style.less ***!
  \*******************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n.tota11y-outlined {\n  outline: 2px solid #7882c8 !important;\n}\n.tota11y-nothingness {\n  color: #888 !important;\n}\n/* Only style the screen reader wand info panel section */\n.tota11y-sidebar.a11y-text-wand .tota11y-info-section.active {\n  height: 500px !important;\n  max-height: 50vh !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/contrast/style.less":
/*!*************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/contrast/style.less ***!
  \*************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-swatches {\n  margin-left: 5px !important;\n  margin-right: 5px !important;\n  position: relative !important;\n  top: 1px !important;\n}\n.tota11y-swatch {\n  border: 1px solid #000 !important;\n  display: inline-block !important;\n  height: 12px !important;\n  width: 12px !important;\n}\n.tota11y-contrast-suggestion {\n  margin: 0 0 15px 15px !important;\n}\n.tota11y-color-hexes {\n  font-family: monospace !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/headings/style.less":
/*!*************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/headings/style.less ***!
  \*************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n.tota11y-heading-outline {\n  color: #333 !important;\n}\n.tota11y-heading-outline-entry {\n  margin-bottom: 8px !important;\n}\n.tota11y-heading-outline-entry.heading-level-1 {\n  margin-left: 0 !important;\n}\n.tota11y-heading-outline-entry.heading-level-2 {\n  margin-left: 20px !important;\n}\n.tota11y-heading-outline-entry.heading-level-3 {\n  margin-left: 40px !important;\n}\n.tota11y-heading-outline-entry.heading-level-4 {\n  margin-left: 60px !important;\n}\n.tota11y-heading-outline-entry.heading-level-5 {\n  margin-left: 80px !important;\n}\n.tota11y-heading-outline-entry.heading-level-6 {\n  margin-left: 100px !important;\n}\n.tota11y-heading-outline-entry.heading-level-higher {\n  margin-left: 100px !important;\n}\n.tota11y-heading-outline-level {\n  position: relative !important;\n  top: -2px !important;\n  right: auto !important;\n  bottom: auto !important;\n  left: auto !important;\n  margin-right: 5px !important;\n  padding: 2px 3px !important;\n  pointer-events: none !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/shared/annotate/style.less":
/*!********************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/shared/annotate/style.less ***!
  \********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n.tota11y-label {\n  background-color: #ffe800 !important;\n  border: 1px solid rgba(0, 0, 0, 0.1) !important;\n  cursor: default !important;\n  padding: 3px !important;\n  position: absolute !important;\n  z-index: 9997 !important;\n}\n.tota11y-label-error {\n  background-color: #ffaeae !important;\n}\n.tota11y-label-error-icon {\n  display: block !important;\n  float: left !important;\n  margin-right: 3px !important;\n  width: 12px !important;\n}\n.tota11y-label-success {\n  background-color: #b9eda9 !important;\n}\n.tota11y-label-warning {\n  background-color: #ffe800 !important;\n}\n.tota11y-label,\n.tota11y-label-text,\n.tota11y-label-detail,\n.tota11y-label-link,\n.tota11y-label-help {\n  color: #333 !important;\n  font-size: 12px !important;\n}\n.tota11y-label-text {\n  float: left !important;\n}\n.tota11y-label-detail {\n  clear: both !important;\n  display: none !important;\n  max-width: 300px !important;\n}\n.tota11y-label:hover .tota11y-label-detail {\n  display: block !important;\n}\n.tota11y-label-help {\n  float: left !important;\n  margin-left: 5px !important;\n}\n.tota11y-label-link:hover,\n.tota11y-label-link:focus {\n  opacity: 0.6 !important;\n  text-decoration: underline !important;\n}\n.tota11y-highlight {\n  background-color: rgba(120, 130, 200, 0.4) !important;\n  pointer-events: none !important;\n  position: absolute !important;\n  z-index: 9999 !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/shared/info-panel/style.less":
/*!**********************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/shared/info-panel/style.less ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n.tota11y-info {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n  border-radius: 5px !important;\n  position: fixed !important;\n  z-index: 9998 !important;\n  /*\n     * Avoid scrollbars on code snippets that are expandable as clicking\n     * scrollbars is difficult if the entire block is click to expand/collapse\n     */\n}\n.tota11y-info-controls {\n  float: right !important;\n}\n.tota11y-info-annotation-toggle {\n  float: left !important;\n  margin-right: 10px !important;\n}\n.tota11y-info-hidden {\n  display: none !important;\n}\n.tota11y-info-dismiss-trigger {\n  font-size: 25px !important;\n  line-height: 25px !important;\n  position: relative !important;\n  top: -2px !important;\n}\n.tota11y-info-title,\n.tota11y-info-body {\n  padding: 10px 10px 0 !important;\n}\n.tota11y-info-title:hover {\n  cursor: move !important;\n}\n.tota11y-info-tabs {\n  display: flex !important;\n  margin: 0 !important;\n  padding: 0 0 10px !important;\n}\n.tota11y-info-tab {\n  height: 30px !important;\n  list-style: none !important;\n  position: relative !important;\n  text-align: center !important;\n  width: 100% !important;\n  flex-grow: 1 !important;\n}\n.tota11y-info-tab-anchor {\n  position: absolute !important;\n  top: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  left: 0 !important;\n  text-align: center !important;\n}\n.tota11y-info-tab-anchor-text {\n  line-height: 30px !important;\n}\n.tota11y-info-tab:hover {\n  background-color: #555 !important;\n}\n.tota11y-info-tab.active,\n.tota11y-info-tab.active:hover {\n  background-color: #f2f2f2 !important;\n}\n.tota11y-info-tab.active .tota11y-info-tab-anchor-text {\n  color: #333 !important;\n}\n.tota11y-info-sections {\n  position: relative !important;\n  height: 270px !important;\n  width: 400px !important;\n}\n.tota11y-info-section {\n  position: absolute !important;\n  top: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  left: 0 !important;\n  background-color: #f2f2f2 !important;\n  display: none !important;\n  overflow-y: scroll !important;\n  padding: 10px !important;\n}\n.tota11y-info-section,\n.tota11y-info-section * {\n  color: #333 !important;\n}\n.tota11y-info-section.active {\n  display: block !important;\n}\n.tota11y-info-errors {\n  margin: 0 !important;\n  padding: 0 !important;\n}\n.tota11y-info-error {\n  list-style: none !important;\n  margin-bottom: 10px !important;\n}\n.tota11y-info-error-trigger {\n  display: block !important;\n}\n.tota11y-info-error-trigger.trigger-highlight {\n  background-color: rgba(120, 130, 200, 0.4) !important;\n}\n.tota11y-info-error-chevron {\n  display: inline-block !important;\n  font-size: 20px !important;\n  height: 14px !important;\n  line-height: 14px !important;\n  margin-right: 3px !important;\n  transform: rotateZ(90deg) !important;\n  transform-origin: 3px 8px !important;\n  transition: transform ease-in-out 50ms !important;\n}\n.tota11y-info-error-trigger.tota11y-collapsed .tota11y-info-error-chevron {\n  transform: rotateZ(0deg) !important;\n}\n.tota11y-info-error-title {\n  font-weight: bold !important;\n}\n.tota11y-info-error-scroll {\n  float: right !important;\n  margin-top: 3px !important;\n  padding-left: 5px !important;\n}\n.tota11y-info-error-scroll-glyph {\n  border-color: #333 !important;\n}\n.tota11y-info-error-scroll:hover .tota11y-info-error-scroll-glyph {\n  border-color: #999 !important;\n}\n.tota11y-info-error-scroll-lens {\n  border: 1px solid !important;\n  border-radius: 50% !important;\n  height: 8px !important;\n  width: 8px !important;\n}\n.tota11y-info-error-scroll-handle {\n  border-left: 1px solid !important;\n  height: 7px !important;\n  transform: translateX(-2px) translateY(-2px) rotate(45deg) !important;\n  width: 1px !important;\n}\n.tota11y-info-error-description {\n  font-size: 13px !important;\n  padding: 10px 0 0 !important;\n  -webkit-user-select: text !important;\n     -moz-user-select: text !important;\n      -ms-user-select: text !important;\n          user-select: text !important;\n}\n.tota11y-info-error-description-code-container {\n  margin-top: 10px !important;\n}\n.tota11y-info-error-description-code-container code {\n  display: block !important;\n  margin-top: 10px !important;\n  padding: 5px 10px !important;\n  word-wrap: break-word !important;\n}\n.tota11y-info-error-description.tota11y-collapsed {\n  display: none !important;\n}\n.tota11y-info-error-count {\n  background-color: red !important;\n  border-radius: 20px !important;\n  color: white !important;\n  display: inline !important;\n  margin-left: 5px !important;\n  padding: 1px 8px !important;\n}\n.tota11y-info .tota11y-info-about-title {\n  padding-bottom: 10px !important;\n  display: block !important;\n}\n.tota11y-info .tota11y-info-about-title-link {\n  text-decoration: underline !important;\n  font-weight: bold !important;\n}\n.tota11y-info .tota11y-info-resources {\n  font-weight: bold !important;\n}\n.tota11y-info .tota11y-info-resources li {\n  margin-left: 10px !important;\n}\n.tota11y-info a.tota11y-info-link {\n  text-decoration: underline !important;\n}\n.tota11y-info blockquote {\n  font-size: 11px !important;\n}\n.tota11y-info blockquote cite {\n  float: right !important;\n  margin: 11px 0 !important;\n  font-style: italic !important;\n}\n.tota11y-info blockquote:before {\n  content: open-quote !important;\n  font-size: 44px !important;\n  vertical-align: -20px !important;\n  line-height: 1px !important;\n}\n.tota11y-info blockquote:after {\n  content: close-quote !important;\n  font-size: 44px !important;\n  vertical-align: -10px !important;\n  line-height: 1px !important;\n  margin-left: calc(100% - 15px) !important;\n}\n.tota11y-info .tota11y-click-to-expand .tota11y-expandable {\n  max-height: 26px !important;\n  cursor: pointer !important;\n  overflow: hidden !important;\n  white-space: nowrap !important;\n  max-width: 100% !important;\n  text-overflow: ellipsis !important;\n}\n.tota11y-info .tota11y-click-to-expand .tota11y-expandable p {\n  overflow: hidden !important;\n  text-overflow: ellipsis !important;\n}\n.tota11y-info .tota11y-click-to-expand.tota11y-expanded .tota11y-expandable {\n  max-height: none !important;\n  overflow: auto !important;\n  white-space: normal !important;\n  text-overflow: clip !important;\n}\n.tota11y-info .tota11y-click-to-expand.tota11y-expanded .tota11y-expandable p {\n  overflow: auto !important;\n  text-overflow: clip !important;\n}\n.tota11y-info .tota11y-expandable code {\n  white-space: pre-wrap !important;\n}\n.tota11y-sidebar {\n  position: static !important;\n}\n.tota11y-sidebar .tota11y-info-sections {\n  width: auto !important;\n  height: auto !important;\n}\n.tota11y-sidebar .tota11y-info-section {\n  position: static !important;\n  overflow-y: auto !important;\n}\n.tota11y-sidebar .tota11y-info-body {\n  padding: 10px 0px 0 !important;\n}\n.tota11y-sidebar .tota11y-info-title {\n  padding: 10px 10px 0 !important;\n}\n.tota11y-sidebar .tota11y-info-error-inspect-element {\n  border: 3px solid #ddd !important;\n  border-radius: 5px !important;\n  display: block !important;\n  margin-top: 10px !important;\n  padding: 3px 10px !important;\n  font-weight: bold !important;\n  background-color: #f2f2f2 !important;\n  cursor: pointer !important;\n}\n.tota11y-sidebar .tota11y-info-error-inspect-element:disabled {\n  cursor: auto !important;\n  background-color: #ddd !important;\n  border-color: #999 !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/style.less":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js!./plugins/style.less ***!
  \****************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")();
exports.push([module.i, ".tota11y-dark-color-scheme {\n  background-color: #333 !important;\n  color: #f2f2f2 !important;\n}\n.tota11y-no-select {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n}\n.tota11y-plugin,\n.tota11y-setting {\n  -webkit-user-select: none !important;\n     -moz-user-select: none !important;\n      -ms-user-select: none !important;\n          user-select: none !important;\n  border-bottom: 1px solid #555 !important;\n  list-style: none !important;\n}\n.tota11y-plugin-switch,\n.tota11y-setting-switch {\n  align-items: center !important;\n  cursor: pointer !important;\n  display: flex !important;\n  padding: 12px 12px 12px 0 !important;\n  margin: 0 !important;\n}\n.tota11y-plugin-indicator,\n.tota11y-setting-indicator {\n  margin: 0 15px !important;\n}\n.tota11y-plugin-indicator,\n.tota11y-setting-indicator {\n  border-radius: 16px !important;\n  border: 1px solid #999 !important;\n  color: transparent !important;\n  font-size: 13px !important;\n  height: 16px !important;\n  line-height: 16px !important;\n  padding: 0 0 0 1px !important;\n  width: 16px !important;\n  min-width: 16px !important;\n  min-height: 16px !important;\n}\n.tota11y-plugin-checkbox:focus + .tota11y-plugin-indicator,\n.tota11y-plugin-checkbox:focus + .tota11y-setting-indicator,\n.tota11y-setting-checkbox:focus + .tota11y-plugin-indicator,\n.tota11y-setting-checkbox:focus + .tota11y-setting-indicator {\n  border-color: #639b24 !important;\n  background-color: #49721a !important;\n  color: #49721a !important;\n}\n.tota11y-plugin-checkbox:checked + .tota11y-plugin-indicator,\n.tota11y-plugin-checkbox:checked + .tota11y-setting-indicator,\n.tota11y-setting-checkbox:checked + .tota11y-plugin-indicator,\n.tota11y-setting-checkbox:checked + .tota11y-setting-indicator {\n  background-color: #639b24 !important;\n  border-color: #639b24 !important;\n  color: white !important;\n}\n.tota11y-plugin-title,\n.tota11y-setting-title {\n  font-weight: bold !important;\n}\n.tota11y-plugin-description,\n.tota11y-setting-description {\n  font-size: 11px !important;\n  font-style: italic !important;\n  width: 200px !important;\n  margin-right: 3px !important;\n}\n.tota11y-plugin-info-setting,\n.tota11y-setting-info-setting {\n  font-size: 11px !important;\n}\n.tota11y-plugins-separator {\n  font-size: 12px !important;\n  margin: 7px 15px 0 !important;\n  text-transform: uppercase !important;\n}\n", ""]);

/***/ }),

/***/ "./node_modules/css-loader/lib/css-base.js":
/*!*************************************************!*\
  !*** ./node_modules/css-loader/lib/css-base.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// 
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(var i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars.runtime.js":
/*!****************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars.runtime.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlebarsBase = __webpack_require__(/*! ./handlebars/base */ "./node_modules/handlebars/dist/cjs/handlebars/base.js");

var base = _interopRequireWildcard(_handlebarsBase);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _handlebarsSafeString = __webpack_require__(/*! ./handlebars/safe-string */ "./node_modules/handlebars/dist/cjs/handlebars/safe-string.js");

var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);

var _handlebarsException = __webpack_require__(/*! ./handlebars/exception */ "./node_modules/handlebars/dist/cjs/handlebars/exception.js");

var _handlebarsException2 = _interopRequireDefault(_handlebarsException);

var _handlebarsUtils = __webpack_require__(/*! ./handlebars/utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

var Utils = _interopRequireWildcard(_handlebarsUtils);

var _handlebarsRuntime = __webpack_require__(/*! ./handlebars/runtime */ "./node_modules/handlebars/dist/cjs/handlebars/runtime.js");

var runtime = _interopRequireWildcard(_handlebarsRuntime);

var _handlebarsNoConflict = __webpack_require__(/*! ./handlebars/no-conflict */ "./node_modules/handlebars/dist/cjs/handlebars/no-conflict.js");

var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _handlebarsSafeString2['default'];
  hb.Exception = _handlebarsException2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_handlebarsNoConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9oYW5kbGViYXJzLnJ1bnRpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OEJBQXNCLG1CQUFtQjs7SUFBN0IsSUFBSTs7Ozs7b0NBSU8sMEJBQTBCOzs7O21DQUMzQix3QkFBd0I7Ozs7K0JBQ3ZCLG9CQUFvQjs7SUFBL0IsS0FBSzs7aUNBQ1Esc0JBQXNCOztJQUFuQyxPQUFPOztvQ0FFSSwwQkFBMEI7Ozs7O0FBR2pELFNBQVMsTUFBTSxHQUFHO0FBQ2hCLE1BQUksRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7O0FBRTFDLE9BQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUUsQ0FBQyxVQUFVLG9DQUFhLENBQUM7QUFDM0IsSUFBRSxDQUFDLFNBQVMsbUNBQVksQ0FBQztBQUN6QixJQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNqQixJQUFFLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDOztBQUU3QyxJQUFFLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQztBQUNoQixJQUFFLENBQUMsUUFBUSxHQUFHLFVBQVMsSUFBSSxFQUFFO0FBQzNCLFdBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDbkMsQ0FBQzs7QUFFRixTQUFPLEVBQUUsQ0FBQztDQUNYOztBQUVELElBQUksSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDOztBQUVyQixrQ0FBVyxJQUFJLENBQUMsQ0FBQzs7QUFFakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQzs7cUJBRVIsSUFBSSIsImZpbGUiOiJoYW5kbGViYXJzLnJ1bnRpbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBiYXNlIGZyb20gJy4vaGFuZGxlYmFycy9iYXNlJztcblxuLy8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuLy8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcbmltcG9ydCBTYWZlU3RyaW5nIGZyb20gJy4vaGFuZGxlYmFycy9zYWZlLXN0cmluZyc7XG5pbXBvcnQgRXhjZXB0aW9uIGZyb20gJy4vaGFuZGxlYmFycy9leGNlcHRpb24nO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9oYW5kbGViYXJzL3V0aWxzJztcbmltcG9ydCAqIGFzIHJ1bnRpbWUgZnJvbSAnLi9oYW5kbGViYXJzL3J1bnRpbWUnO1xuXG5pbXBvcnQgbm9Db25mbGljdCBmcm9tICcuL2hhbmRsZWJhcnMvbm8tY29uZmxpY3QnO1xuXG4vLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2VcbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgbGV0IGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cbiAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcbiAgaGIuU2FmZVN0cmluZyA9IFNhZmVTdHJpbmc7XG4gIGhiLkV4Y2VwdGlvbiA9IEV4Y2VwdGlvbjtcbiAgaGIuVXRpbHMgPSBVdGlscztcbiAgaGIuZXNjYXBlRXhwcmVzc2lvbiA9IFV0aWxzLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgaGIuVk0gPSBydW50aW1lO1xuICBoYi50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHNwZWMpIHtcbiAgICByZXR1cm4gcnVudGltZS50ZW1wbGF0ZShzcGVjLCBoYik7XG4gIH07XG5cbiAgcmV0dXJuIGhiO1xufVxuXG5sZXQgaW5zdCA9IGNyZWF0ZSgpO1xuaW5zdC5jcmVhdGUgPSBjcmVhdGU7XG5cbm5vQ29uZmxpY3QoaW5zdCk7XG5cbmluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cbmV4cG9ydCBkZWZhdWx0IGluc3Q7XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/base.js":
/*!*************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/base.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = __webpack_require__(/*! ./utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

var _exception = __webpack_require__(/*! ./exception */ "./node_modules/handlebars/dist/cjs/handlebars/exception.js");

var _exception2 = _interopRequireDefault(_exception);

var _helpers = __webpack_require__(/*! ./helpers */ "./node_modules/handlebars/dist/cjs/handlebars/helpers.js");

var _decorators = __webpack_require__(/*! ./decorators */ "./node_modules/handlebars/dist/cjs/handlebars/decorators.js");

var _logger = __webpack_require__(/*! ./logger */ "./node_modules/handlebars/dist/cjs/handlebars/logger.js");

var _logger2 = _interopRequireDefault(_logger);

var VERSION = '4.1.0';
exports.VERSION = VERSION;
var COMPILER_REVISION = 7;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1',
  7: '>= 4.0.0'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials, decorators) {
  this.helpers = helpers || {};
  this.partials = partials || {};
  this.decorators = decorators || {};

  _helpers.registerDefaultHelpers(this);
  _decorators.registerDefaultDecorators(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: _logger2['default'],
  log: _logger2['default'].log,

  registerHelper: function registerHelper(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple helpers');
      }
      _utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (_utils.toString.call(name) === objectType) {
      _utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _exception2['default']('Attempting to register a partial called "' + name + '" as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  },

  registerDecorator: function registerDecorator(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple decorators');
      }
      _utils.extend(this.decorators, name);
    } else {
      this.decorators[name] = fn;
    }
  },
  unregisterDecorator: function unregisterDecorator(name) {
    delete this.decorators[name];
  }
};

var log = _logger2['default'].log;

exports.log = log;
exports.createFrame = _utils.createFrame;
exports.logger = _logger2['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2Jhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7cUJBQTRDLFNBQVM7O3lCQUMvQixhQUFhOzs7O3VCQUNFLFdBQVc7OzBCQUNSLGNBQWM7O3NCQUNuQyxVQUFVOzs7O0FBRXRCLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQzs7QUFDeEIsSUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7OztBQUU1QixJQUFNLGdCQUFnQixHQUFHO0FBQzlCLEdBQUMsRUFBRSxhQUFhO0FBQ2hCLEdBQUMsRUFBRSxlQUFlO0FBQ2xCLEdBQUMsRUFBRSxlQUFlO0FBQ2xCLEdBQUMsRUFBRSxVQUFVO0FBQ2IsR0FBQyxFQUFFLGtCQUFrQjtBQUNyQixHQUFDLEVBQUUsaUJBQWlCO0FBQ3BCLEdBQUMsRUFBRSxVQUFVO0NBQ2QsQ0FBQzs7O0FBRUYsSUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUM7O0FBRTlCLFNBQVMscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUU7QUFDbkUsTUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQzdCLE1BQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxJQUFJLEVBQUUsQ0FBQztBQUMvQixNQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsSUFBSSxFQUFFLENBQUM7O0FBRW5DLGtDQUF1QixJQUFJLENBQUMsQ0FBQztBQUM3Qix3Q0FBMEIsSUFBSSxDQUFDLENBQUM7Q0FDakM7O0FBRUQscUJBQXFCLENBQUMsU0FBUyxHQUFHO0FBQ2hDLGFBQVcsRUFBRSxxQkFBcUI7O0FBRWxDLFFBQU0scUJBQVE7QUFDZCxLQUFHLEVBQUUsb0JBQU8sR0FBRzs7QUFFZixnQkFBYyxFQUFFLHdCQUFTLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDakMsUUFBSSxnQkFBUyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssVUFBVSxFQUFFO0FBQ3RDLFVBQUksRUFBRSxFQUFFO0FBQUUsY0FBTSwyQkFBYyx5Q0FBeUMsQ0FBQyxDQUFDO09BQUU7QUFDM0Usb0JBQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1QixNQUFNO0FBQ0wsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDekI7R0FDRjtBQUNELGtCQUFnQixFQUFFLDBCQUFTLElBQUksRUFBRTtBQUMvQixXQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDM0I7O0FBRUQsaUJBQWUsRUFBRSx5QkFBUyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3ZDLFFBQUksZ0JBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFVBQVUsRUFBRTtBQUN0QyxvQkFBTyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdCLE1BQU07QUFDTCxVQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtBQUNsQyxjQUFNLHlFQUEwRCxJQUFJLG9CQUFpQixDQUFDO09BQ3ZGO0FBQ0QsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUM7S0FDL0I7R0FDRjtBQUNELG1CQUFpQixFQUFFLDJCQUFTLElBQUksRUFBRTtBQUNoQyxXQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDNUI7O0FBRUQsbUJBQWlCLEVBQUUsMkJBQVMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNwQyxRQUFJLGdCQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7QUFDdEMsVUFBSSxFQUFFLEVBQUU7QUFBRSxjQUFNLDJCQUFjLDRDQUE0QyxDQUFDLENBQUM7T0FBRTtBQUM5RSxvQkFBTyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQy9CLE1BQU07QUFDTCxVQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUM1QjtHQUNGO0FBQ0QscUJBQW1CLEVBQUUsNkJBQVMsSUFBSSxFQUFFO0FBQ2xDLFdBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUM5QjtDQUNGLENBQUM7O0FBRUssSUFBSSxHQUFHLEdBQUcsb0JBQU8sR0FBRyxDQUFDOzs7UUFFcEIsV0FBVztRQUFFLE1BQU0iLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Y3JlYXRlRnJhbWUsIGV4dGVuZCwgdG9TdHJpbmd9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IEV4Y2VwdGlvbiBmcm9tICcuL2V4Y2VwdGlvbic7XG5pbXBvcnQge3JlZ2lzdGVyRGVmYXVsdEhlbHBlcnN9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQge3JlZ2lzdGVyRGVmYXVsdERlY29yYXRvcnN9IGZyb20gJy4vZGVjb3JhdG9ycyc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4vbG9nZ2VyJztcblxuZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnNC4xLjAnO1xuZXhwb3J0IGNvbnN0IENPTVBJTEVSX1JFVklTSU9OID0gNztcblxuZXhwb3J0IGNvbnN0IFJFVklTSU9OX0NIQU5HRVMgPSB7XG4gIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG4gIDI6ICc9PSAxLjAuMC1yYy4zJyxcbiAgMzogJz09IDEuMC4wLXJjLjQnLFxuICA0OiAnPT0gMS54LngnLFxuICA1OiAnPT0gMi4wLjAtYWxwaGEueCcsXG4gIDY6ICc+PSAyLjAuMC1iZXRhLjEnLFxuICA3OiAnPj0gNC4wLjAnXG59O1xuXG5jb25zdCBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBIYW5kbGViYXJzRW52aXJvbm1lbnQoaGVscGVycywgcGFydGlhbHMsIGRlY29yYXRvcnMpIHtcbiAgdGhpcy5oZWxwZXJzID0gaGVscGVycyB8fCB7fTtcbiAgdGhpcy5wYXJ0aWFscyA9IHBhcnRpYWxzIHx8IHt9O1xuICB0aGlzLmRlY29yYXRvcnMgPSBkZWNvcmF0b3JzIHx8IHt9O1xuXG4gIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnModGhpcyk7XG4gIHJlZ2lzdGVyRGVmYXVsdERlY29yYXRvcnModGhpcyk7XG59XG5cbkhhbmRsZWJhcnNFbnZpcm9ubWVudC5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBIYW5kbGViYXJzRW52aXJvbm1lbnQsXG5cbiAgbG9nZ2VyOiBsb2dnZXIsXG4gIGxvZzogbG9nZ2VyLmxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24obmFtZSwgZm4pIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGZuKSB7IHRocm93IG5ldyBFeGNlcHRpb24oJ0FyZyBub3Qgc3VwcG9ydGVkIHdpdGggbXVsdGlwbGUgaGVscGVycycpOyB9XG4gICAgICBleHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMuaGVscGVyc1tuYW1lXTtcbiAgfSxcblxuICByZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uKG5hbWUsIHBhcnRpYWwpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgZXh0ZW5kKHRoaXMucGFydGlhbHMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oYEF0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgYSBwYXJ0aWFsIGNhbGxlZCBcIiR7bmFtZX1cIiBhcyB1bmRlZmluZWRgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuICAgIH1cbiAgfSxcbiAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5wYXJ0aWFsc1tuYW1lXTtcbiAgfSxcblxuICByZWdpc3RlckRlY29yYXRvcjogZnVuY3Rpb24obmFtZSwgZm4pIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGZuKSB7IHRocm93IG5ldyBFeGNlcHRpb24oJ0FyZyBub3Qgc3VwcG9ydGVkIHdpdGggbXVsdGlwbGUgZGVjb3JhdG9ycycpOyB9XG4gICAgICBleHRlbmQodGhpcy5kZWNvcmF0b3JzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWNvcmF0b3JzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVyRGVjb3JhdG9yOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMuZGVjb3JhdG9yc1tuYW1lXTtcbiAgfVxufTtcblxuZXhwb3J0IGxldCBsb2cgPSBsb2dnZXIubG9nO1xuXG5leHBvcnQge2NyZWF0ZUZyYW1lLCBsb2dnZXJ9O1xuIl19


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/decorators.js":
/*!*******************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/decorators.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.registerDefaultDecorators = registerDefaultDecorators;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decoratorsInline = __webpack_require__(/*! ./decorators/inline */ "./node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js");

var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);

function registerDefaultDecorators(instance) {
  _decoratorsInline2['default'](instance);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2RlY29yYXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Z0NBQTJCLHFCQUFxQjs7OztBQUV6QyxTQUFTLHlCQUF5QixDQUFDLFFBQVEsRUFBRTtBQUNsRCxnQ0FBZSxRQUFRLENBQUMsQ0FBQztDQUMxQiIsImZpbGUiOiJkZWNvcmF0b3JzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlZ2lzdGVySW5saW5lIGZyb20gJy4vZGVjb3JhdG9ycy9pbmxpbmUnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0RGVjb3JhdG9ycyhpbnN0YW5jZSkge1xuICByZWdpc3RlcklubGluZShpbnN0YW5jZSk7XG59XG5cbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js":
/*!**************************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _utils = __webpack_require__(/*! ../utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

exports['default'] = function (instance) {
  instance.registerDecorator('inline', function (fn, props, container, options) {
    var ret = fn;
    if (!props.partials) {
      props.partials = {};
      ret = function (context, options) {
        // Create a new partials stack frame prior to exec.
        var original = container.partials;
        container.partials = _utils.extend({}, original, props.partials);
        var ret = fn(context, options);
        container.partials = original;
        return ret;
      };
    }

    props.partials[options.args[0]] = options.fn;

    return ret;
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2RlY29yYXRvcnMvaW5saW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7cUJBQXFCLFVBQVU7O3FCQUVoQixVQUFTLFFBQVEsRUFBRTtBQUNoQyxVQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLFVBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFO0FBQzNFLFFBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNiLFFBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQ25CLFdBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFNBQUcsR0FBRyxVQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUU7O0FBRS9CLFlBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDbEMsaUJBQVMsQ0FBQyxRQUFRLEdBQUcsY0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxRCxZQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLGlCQUFTLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUM5QixlQUFPLEdBQUcsQ0FBQztPQUNaLENBQUM7S0FDSDs7QUFFRCxTQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOztBQUU3QyxXQUFPLEdBQUcsQ0FBQztHQUNaLENBQUMsQ0FBQztDQUNKIiwiZmlsZSI6ImlubGluZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7ZXh0ZW5kfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGluc3RhbmNlKSB7XG4gIGluc3RhbmNlLnJlZ2lzdGVyRGVjb3JhdG9yKCdpbmxpbmUnLCBmdW5jdGlvbihmbiwgcHJvcHMsIGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIGxldCByZXQgPSBmbjtcbiAgICBpZiAoIXByb3BzLnBhcnRpYWxzKSB7XG4gICAgICBwcm9wcy5wYXJ0aWFscyA9IHt9O1xuICAgICAgcmV0ID0gZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgcGFydGlhbHMgc3RhY2sgZnJhbWUgcHJpb3IgdG8gZXhlYy5cbiAgICAgICAgbGV0IG9yaWdpbmFsID0gY29udGFpbmVyLnBhcnRpYWxzO1xuICAgICAgICBjb250YWluZXIucGFydGlhbHMgPSBleHRlbmQoe30sIG9yaWdpbmFsLCBwcm9wcy5wYXJ0aWFscyk7XG4gICAgICAgIGxldCByZXQgPSBmbihjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gb3JpZ2luYWw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHByb3BzLnBhcnRpYWxzW29wdGlvbnMuYXJnc1swXV0gPSBvcHRpb25zLmZuO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG59XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/exception.js":
/*!******************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/exception.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  /* istanbul ignore else */
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  try {
    if (loc) {
      this.lineNumber = line;

      // Work around issue under safari where we can't directly set the column value
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(this, 'column', {
          value: column,
          enumerable: true
        });
      } else {
        this.column = column;
      }
    }
  } catch (nop) {
    /* Ignore if the browser is very particular */
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQ0EsSUFBTSxVQUFVLEdBQUcsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFbkcsU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtBQUNoQyxNQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUc7TUFDdEIsSUFBSSxZQUFBO01BQ0osTUFBTSxZQUFBLENBQUM7QUFDWCxNQUFJLEdBQUcsRUFBRTtBQUNQLFFBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztBQUN0QixVQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7O0FBRTFCLFdBQU8sSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7R0FDeEM7O0FBRUQsTUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzs7O0FBRzFELE9BQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFO0FBQ2hELFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7R0FDOUM7OztBQUdELE1BQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO0FBQzNCLFNBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDMUM7O0FBRUQsTUFBSTtBQUNGLFFBQUksR0FBRyxFQUFFO0FBQ1AsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Ozs7QUFJdkIsVUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFO0FBQ3pCLGNBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxlQUFLLEVBQUUsTUFBTTtBQUNiLG9CQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7T0FDSixNQUFNO0FBQ0wsWUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7T0FDdEI7S0FDRjtHQUNGLENBQUMsT0FBTyxHQUFHLEVBQUU7O0dBRWI7Q0FDRjs7QUFFRCxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7O3FCQUVuQixTQUFTIiwiZmlsZSI6ImV4Y2VwdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuY29uc3QgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIGxldCBsb2MgPSBub2RlICYmIG5vZGUubG9jLFxuICAgICAgbGluZSxcbiAgICAgIGNvbHVtbjtcbiAgaWYgKGxvYykge1xuICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcbiAgICBjb2x1bW4gPSBsb2Muc3RhcnQuY29sdW1uO1xuXG4gICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBjb2x1bW47XG4gIH1cblxuICBsZXQgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgRXhjZXB0aW9uKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGxvYykge1xuICAgICAgdGhpcy5saW5lTnVtYmVyID0gbGluZTtcblxuICAgICAgLy8gV29yayBhcm91bmQgaXNzdWUgdW5kZXIgc2FmYXJpIHdoZXJlIHdlIGNhbid0IGRpcmVjdGx5IHNldCB0aGUgY29sdW1uIHZhbHVlXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2NvbHVtbicsIHtcbiAgICAgICAgICB2YWx1ZTogY29sdW1uLFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKG5vcCkge1xuICAgIC8qIElnbm9yZSBpZiB0aGUgYnJvd3NlciBpcyB2ZXJ5IHBhcnRpY3VsYXIgKi9cbiAgfVxufVxuXG5FeGNlcHRpb24ucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5cbmV4cG9ydCBkZWZhdWx0IEV4Y2VwdGlvbjtcbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers.js":
/*!****************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.registerDefaultHelpers = registerDefaultHelpers;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _helpersBlockHelperMissing = __webpack_require__(/*! ./helpers/block-helper-missing */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js");

var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);

var _helpersEach = __webpack_require__(/*! ./helpers/each */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/each.js");

var _helpersEach2 = _interopRequireDefault(_helpersEach);

var _helpersHelperMissing = __webpack_require__(/*! ./helpers/helper-missing */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js");

var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);

var _helpersIf = __webpack_require__(/*! ./helpers/if */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/if.js");

var _helpersIf2 = _interopRequireDefault(_helpersIf);

var _helpersLog = __webpack_require__(/*! ./helpers/log */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/log.js");

var _helpersLog2 = _interopRequireDefault(_helpersLog);

var _helpersLookup = __webpack_require__(/*! ./helpers/lookup */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js");

var _helpersLookup2 = _interopRequireDefault(_helpersLookup);

var _helpersWith = __webpack_require__(/*! ./helpers/with */ "./node_modules/handlebars/dist/cjs/handlebars/helpers/with.js");

var _helpersWith2 = _interopRequireDefault(_helpersWith);

function registerDefaultHelpers(instance) {
  _helpersBlockHelperMissing2['default'](instance);
  _helpersEach2['default'](instance);
  _helpersHelperMissing2['default'](instance);
  _helpersIf2['default'](instance);
  _helpersLog2['default'](instance);
  _helpersLookup2['default'](instance);
  _helpersWith2['default'](instance);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7eUNBQXVDLGdDQUFnQzs7OzsyQkFDOUMsZ0JBQWdCOzs7O29DQUNQLDBCQUEwQjs7Ozt5QkFDckMsY0FBYzs7OzswQkFDYixlQUFlOzs7OzZCQUNaLGtCQUFrQjs7OzsyQkFDcEIsZ0JBQWdCOzs7O0FBRWxDLFNBQVMsc0JBQXNCLENBQUMsUUFBUSxFQUFFO0FBQy9DLHlDQUEyQixRQUFRLENBQUMsQ0FBQztBQUNyQywyQkFBYSxRQUFRLENBQUMsQ0FBQztBQUN2QixvQ0FBc0IsUUFBUSxDQUFDLENBQUM7QUFDaEMseUJBQVcsUUFBUSxDQUFDLENBQUM7QUFDckIsMEJBQVksUUFBUSxDQUFDLENBQUM7QUFDdEIsNkJBQWUsUUFBUSxDQUFDLENBQUM7QUFDekIsMkJBQWEsUUFBUSxDQUFDLENBQUM7Q0FDeEIiLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZWdpc3RlckJsb2NrSGVscGVyTWlzc2luZyBmcm9tICcuL2hlbHBlcnMvYmxvY2staGVscGVyLW1pc3NpbmcnO1xuaW1wb3J0IHJlZ2lzdGVyRWFjaCBmcm9tICcuL2hlbHBlcnMvZWFjaCc7XG5pbXBvcnQgcmVnaXN0ZXJIZWxwZXJNaXNzaW5nIGZyb20gJy4vaGVscGVycy9oZWxwZXItbWlzc2luZyc7XG5pbXBvcnQgcmVnaXN0ZXJJZiBmcm9tICcuL2hlbHBlcnMvaWYnO1xuaW1wb3J0IHJlZ2lzdGVyTG9nIGZyb20gJy4vaGVscGVycy9sb2cnO1xuaW1wb3J0IHJlZ2lzdGVyTG9va3VwIGZyb20gJy4vaGVscGVycy9sb29rdXAnO1xuaW1wb3J0IHJlZ2lzdGVyV2l0aCBmcm9tICcuL2hlbHBlcnMvd2l0aCc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRlZmF1bHRIZWxwZXJzKGluc3RhbmNlKSB7XG4gIHJlZ2lzdGVyQmxvY2tIZWxwZXJNaXNzaW5nKGluc3RhbmNlKTtcbiAgcmVnaXN0ZXJFYWNoKGluc3RhbmNlKTtcbiAgcmVnaXN0ZXJIZWxwZXJNaXNzaW5nKGluc3RhbmNlKTtcbiAgcmVnaXN0ZXJJZihpbnN0YW5jZSk7XG4gIHJlZ2lzdGVyTG9nKGluc3RhbmNlKTtcbiAgcmVnaXN0ZXJMb29rdXAoaW5zdGFuY2UpO1xuICByZWdpc3RlcldpdGgoaW5zdGFuY2UpO1xufVxuIl19


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _utils = __webpack_require__(/*! ../utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

exports['default'] = function (instance) {
  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (_utils.isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvYmxvY2staGVscGVyLW1pc3NpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztxQkFBc0QsVUFBVTs7cUJBRWpELFVBQVMsUUFBUSxFQUFFO0FBQ2hDLFVBQVEsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsVUFBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ3ZFLFFBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPO1FBQ3pCLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOztBQUVwQixRQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDcEIsYUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDakIsTUFBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtBQUMvQyxhQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN0QixNQUFNLElBQUksZUFBUSxPQUFPLENBQUMsRUFBRTtBQUMzQixVQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3RCLFlBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUNmLGlCQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzlCOztBQUVELGVBQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO09BQ2hELE1BQU07QUFDTCxlQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUN0QjtLQUNGLE1BQU07QUFDTCxVQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUMvQixZQUFJLElBQUksR0FBRyxtQkFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsWUFBSSxDQUFDLFdBQVcsR0FBRyx5QkFBa0IsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdFLGVBQU8sR0FBRyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQztPQUN4Qjs7QUFFRCxhQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDN0I7R0FDRixDQUFDLENBQUM7Q0FDSiIsImZpbGUiOiJibG9jay1oZWxwZXItbWlzc2luZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7YXBwZW5kQ29udGV4dFBhdGgsIGNyZWF0ZUZyYW1lLCBpc0FycmF5fSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGluc3RhbmNlKSB7XG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgbGV0IGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmIChjb250ZXh0ID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZm4odGhpcyk7XG4gICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYgKGNvbnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAob3B0aW9ucy5pZHMpIHtcbiAgICAgICAgICBvcHRpb25zLmlkcyA9IFtvcHRpb25zLm5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnMuZWFjaChjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICAgIGxldCBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IGFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5uYW1lKTtcbiAgICAgICAgb3B0aW9ucyA9IHtkYXRhOiBkYXRhfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/each.js":
/*!*********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/each.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = __webpack_require__(/*! ../utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

var _exception = __webpack_require__(/*! ../exception */ "./node_modules/handlebars/dist/cjs/handlebars/exception.js");

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = _utils.createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (_utils.isArray(context)) {
        for (var j = context.length; i < j; i++) {
          if (i in context) {
            execIteration(i, i, i === context.length - 1);
          }
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey !== undefined) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvZWFjaC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3FCQUErRSxVQUFVOzt5QkFDbkUsY0FBYzs7OztxQkFFckIsVUFBUyxRQUFRLEVBQUU7QUFDaEMsVUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ3pELFFBQUksQ0FBQyxPQUFPLEVBQUU7QUFDWixZQUFNLDJCQUFjLDZCQUE2QixDQUFDLENBQUM7S0FDcEQ7O0FBRUQsUUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUU7UUFDZixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU87UUFDekIsQ0FBQyxHQUFHLENBQUM7UUFDTCxHQUFHLEdBQUcsRUFBRTtRQUNSLElBQUksWUFBQTtRQUNKLFdBQVcsWUFBQSxDQUFDOztBQUVoQixRQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUMvQixpQkFBVyxHQUFHLHlCQUFrQixPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0tBQ2pGOztBQUVELFFBQUksa0JBQVcsT0FBTyxDQUFDLEVBQUU7QUFBRSxhQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUFFOztBQUUxRCxRQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDaEIsVUFBSSxHQUFHLG1CQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNsQzs7QUFFRCxhQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUN6QyxVQUFJLElBQUksRUFBRTtBQUNSLFlBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLFlBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQztBQUN6QixZQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7O0FBRW5CLFlBQUksV0FBVyxFQUFFO0FBQ2YsY0FBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3hDO09BQ0Y7O0FBRUQsU0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzdCLFlBQUksRUFBRSxJQUFJO0FBQ1YsbUJBQVcsRUFBRSxtQkFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDL0UsQ0FBQyxDQUFDO0tBQ0o7O0FBRUQsUUFBSSxPQUFPLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO0FBQzFDLFVBQUksZUFBUSxPQUFPLENBQUMsRUFBRTtBQUNwQixhQUFLLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN2QyxjQUFJLENBQUMsSUFBSSxPQUFPLEVBQUU7QUFDaEIseUJBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1dBQy9DO1NBQ0Y7T0FDRixNQUFNO0FBQ0wsWUFBSSxRQUFRLFlBQUEsQ0FBQzs7QUFFYixhQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sRUFBRTtBQUN2QixjQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Ozs7QUFJL0IsZ0JBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtBQUMxQiwyQkFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDaEM7QUFDRCxvQkFBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLGFBQUMsRUFBRSxDQUFDO1dBQ0w7U0FDRjtBQUNELFlBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtBQUMxQix1QkFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3RDO09BQ0Y7S0FDRjs7QUFFRCxRQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDWCxTQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JCOztBQUVELFdBQU8sR0FBRyxDQUFDO0dBQ1osQ0FBQyxDQUFDO0NBQ0oiLCJmaWxlIjoiZWFjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7YXBwZW5kQ29udGV4dFBhdGgsIGJsb2NrUGFyYW1zLCBjcmVhdGVGcmFtZSwgaXNBcnJheSwgaXNGdW5jdGlvbn0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEV4Y2VwdGlvbiBmcm9tICcuLi9leGNlcHRpb24nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignZWFjaCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ011c3QgcGFzcyBpdGVyYXRvciB0byAjZWFjaCcpO1xuICAgIH1cblxuICAgIGxldCBmbiA9IG9wdGlvbnMuZm4sXG4gICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICByZXQgPSAnJyxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgY29udGV4dFBhdGg7XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICBjb250ZXh0UGF0aCA9IGFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pICsgJy4nO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7IGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7IH1cblxuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWNJdGVyYXRpb24oZmllbGQsIGluZGV4LCBsYXN0KSB7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuICAgICAgICBkYXRhLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGRhdGEuZmlyc3QgPSBpbmRleCA9PT0gMDtcbiAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG4gICAgICAgIGlmIChjb250ZXh0UGF0aCkge1xuICAgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBjb250ZXh0UGF0aCArIGZpZWxkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbZmllbGRdLCB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGJsb2NrUGFyYW1zOiBibG9ja1BhcmFtcyhbY29udGV4dFtmaWVsZF0sIGZpZWxkXSwgW2NvbnRleHRQYXRoICsgZmllbGQsIG51bGxdKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgICBmb3IgKGxldCBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBpZiAoaSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgICBleGVjSXRlcmF0aW9uKGksIGksIGkgPT09IGNvbnRleHQubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJpb3JLZXk7XG5cbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbnRleHQpIHtcbiAgICAgICAgICBpZiAoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAvLyBXZSdyZSBydW5uaW5nIHRoZSBpdGVyYXRpb25zIG9uZSBzdGVwIG91dCBvZiBzeW5jIHNvIHdlIGNhbiBkZXRlY3RcbiAgICAgICAgICAgIC8vIHRoZSBsYXN0IGl0ZXJhdGlvbiB3aXRob3V0IGhhdmUgdG8gc2NhbiB0aGUgb2JqZWN0IHR3aWNlIGFuZCBjcmVhdGVcbiAgICAgICAgICAgIC8vIGFuIGl0ZXJtZWRpYXRlIGtleXMgYXJyYXkuXG4gICAgICAgICAgICBpZiAocHJpb3JLZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmlvcktleSA9IGtleTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByaW9yS2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcbn1cbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = __webpack_require__(/*! ../exception */ "./node_modules/handlebars/dist/cjs/handlebars/exception.js");

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('helperMissing', function () /* [args, ]options */{
    if (arguments.length === 1) {
      // A missing field in a {{foo}} construct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvaGVscGVyLW1pc3NpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozt5QkFBc0IsY0FBYzs7OztxQkFFckIsVUFBUyxRQUFRLEVBQUU7QUFDaEMsVUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQUUsaUNBQWdDO0FBQ3ZFLFFBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7O0FBRTFCLGFBQU8sU0FBUyxDQUFDO0tBQ2xCLE1BQU07O0FBRUwsWUFBTSwyQkFBYyxtQkFBbUIsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7S0FDdkY7R0FDRixDQUFDLENBQUM7Q0FDSiIsImZpbGUiOiJoZWxwZXItbWlzc2luZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeGNlcHRpb24gZnJvbSAnLi4vZXhjZXB0aW9uJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbigvKiBbYXJncywgXW9wdGlvbnMgKi8pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gQSBtaXNzaW5nIGZpZWxkIGluIGEge3tmb299fSBjb25zdHJ1Y3QuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTb21lb25lIGlzIGFjdHVhbGx5IHRyeWluZyB0byBjYWxsIHNvbWV0aGluZywgYmxvdyB1cC5cbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ01pc3NpbmcgaGVscGVyOiBcIicgKyBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdLm5hbWUgKyAnXCInKTtcbiAgICB9XG4gIH0pO1xufVxuIl19


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/if.js":
/*!*******************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/if.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _utils = __webpack_require__(/*! ../utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

exports['default'] = function (instance) {
  instance.registerHelper('if', function (conditional, options) {
    if (_utils.isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvaWYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztxQkFBa0MsVUFBVTs7cUJBRTdCLFVBQVMsUUFBUSxFQUFFO0FBQ2hDLFVBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFVBQVMsV0FBVyxFQUFFLE9BQU8sRUFBRTtBQUMzRCxRQUFJLGtCQUFXLFdBQVcsQ0FBQyxFQUFFO0FBQUUsaUJBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQUU7Ozs7O0FBS3RFLFFBQUksQUFBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsV0FBVyxJQUFLLGVBQVEsV0FBVyxDQUFDLEVBQUU7QUFDdkUsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzlCLE1BQU07QUFDTCxhQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDekI7R0FDRixDQUFDLENBQUM7O0FBRUgsVUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsVUFBUyxXQUFXLEVBQUUsT0FBTyxFQUFFO0FBQy9ELFdBQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztHQUN2SCxDQUFDLENBQUM7Q0FDSiIsImZpbGUiOiJpZi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aXNFbXB0eSwgaXNGdW5jdGlvbn0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkgeyBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7IH1cblxuICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cbiAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG4gICAgaWYgKCghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCkgfHwgaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwge2ZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaH0pO1xuICB9KTtcbn1cbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/log.js":
/*!********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/log.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('log', function () /* message, options */{
    var args = [undefined],
        options = arguments[arguments.length - 1];
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i]);
    }

    var level = 1;
    if (options.hash.level != null) {
      level = options.hash.level;
    } else if (options.data && options.data.level != null) {
      level = options.data.level;
    }
    args[0] = level;

    instance.log.apply(instance, args);
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvbG9nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7cUJBQWUsVUFBUyxRQUFRLEVBQUU7QUFDaEMsVUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsa0NBQWlDO0FBQzlELFFBQUksSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ2xCLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QyxTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsVUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN6Qjs7QUFFRCxRQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZCxRQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtBQUM5QixXQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDNUIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ3JELFdBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztLQUM1QjtBQUNELFFBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7O0FBRWhCLFlBQVEsQ0FBQyxHQUFHLE1BQUEsQ0FBWixRQUFRLEVBQVMsSUFBSSxDQUFDLENBQUM7R0FDeEIsQ0FBQyxDQUFDO0NBQ0oiLCJmaWxlIjoibG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvZycsIGZ1bmN0aW9uKC8qIG1lc3NhZ2UsIG9wdGlvbnMgKi8pIHtcbiAgICBsZXQgYXJncyA9IFt1bmRlZmluZWRdLFxuICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgIH1cblxuICAgIGxldCBsZXZlbCA9IDE7XG4gICAgaWYgKG9wdGlvbnMuaGFzaC5sZXZlbCAhPSBudWxsKSB7XG4gICAgICBsZXZlbCA9IG9wdGlvbnMuaGFzaC5sZXZlbDtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCkge1xuICAgICAgbGV2ZWwgPSBvcHRpb25zLmRhdGEubGV2ZWw7XG4gICAgfVxuICAgIGFyZ3NbMF0gPSBsZXZlbDtcblxuICAgIGluc3RhbmNlLmxvZyguLi4gYXJncyk7XG4gIH0pO1xufVxuIl19


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js":
/*!***********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvbG9va3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7cUJBQWUsVUFBUyxRQUFRLEVBQUU7QUFDaEMsVUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsVUFBUyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3JELFdBQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUMxQixDQUFDLENBQUM7Q0FDSiIsImZpbGUiOiJsb29rdXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9va3VwJywgZnVuY3Rpb24ob2JqLCBmaWVsZCkge1xuICAgIHJldHVybiBvYmogJiYgb2JqW2ZpZWxkXTtcbiAgfSk7XG59XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/helpers/with.js":
/*!*********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/helpers/with.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _utils = __webpack_require__(/*! ../utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

exports['default'] = function (instance) {
  instance.registerHelper('with', function (context, options) {
    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!_utils.isEmpty(context)) {
      var data = options.data;
      if (options.data && options.ids) {
        data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
      }

      return fn(context, {
        data: data,
        blockParams: _utils.blockParams([context], [data && data.contextPath])
      });
    } else {
      return options.inverse(this);
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2hlbHBlcnMvd2l0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O3FCQUErRSxVQUFVOztxQkFFMUUsVUFBUyxRQUFRLEVBQUU7QUFDaEMsVUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ3pELFFBQUksa0JBQVcsT0FBTyxDQUFDLEVBQUU7QUFBRSxhQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUFFOztBQUUxRCxRQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOztBQUVwQixRQUFJLENBQUMsZUFBUSxPQUFPLENBQUMsRUFBRTtBQUNyQixVQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3hCLFVBQUksT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQy9CLFlBQUksR0FBRyxtQkFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsWUFBSSxDQUFDLFdBQVcsR0FBRyx5QkFBa0IsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ2hGOztBQUVELGFBQU8sRUFBRSxDQUFDLE9BQU8sRUFBRTtBQUNqQixZQUFJLEVBQUUsSUFBSTtBQUNWLG1CQUFXLEVBQUUsbUJBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7T0FDaEUsQ0FBQyxDQUFDO0tBQ0osTUFBTTtBQUNMLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtHQUNGLENBQUMsQ0FBQztDQUNKIiwiZmlsZSI6IndpdGguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2FwcGVuZENvbnRleHRQYXRoLCBibG9ja1BhcmFtcywgY3JlYXRlRnJhbWUsIGlzRW1wdHksIGlzRnVuY3Rpb259IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3dpdGgnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgbGV0IGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmICghaXNFbXB0eShjb250ZXh0KSkge1xuICAgICAgbGV0IGRhdGEgPSBvcHRpb25zLmRhdGE7XG4gICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgICAgICBkYXRhLmNvbnRleHRQYXRoID0gYXBwZW5kQ29udGV4dFBhdGgob3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoLCBvcHRpb25zLmlkc1swXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbihjb250ZXh0LCB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGJsb2NrUGFyYW1zOiBibG9ja1BhcmFtcyhbY29udGV4dF0sIFtkYXRhICYmIGRhdGEuY29udGV4dFBhdGhdKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/logger.js":
/*!***************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/logger.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _utils = __webpack_require__(/*! ./utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

var logger = {
  methodMap: ['debug', 'info', 'warn', 'error'],
  level: 'info',

  // Maps a given level value to the `methodMap` indexes above.
  lookupLevel: function lookupLevel(level) {
    if (typeof level === 'string') {
      var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
      if (levelMap >= 0) {
        level = levelMap;
      } else {
        level = parseInt(level, 10);
      }
    }

    return level;
  },

  // Can be overridden in the host environment
  log: function log(level) {
    level = logger.lookupLevel(level);

    if (typeof console !== 'undefined' && logger.lookupLevel(logger.level) <= level) {
      var method = logger.methodMap[level];
      if (!console[method]) {
        // eslint-disable-line no-console
        method = 'log';
      }

      for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        message[_key - 1] = arguments[_key];
      }

      console[method].apply(console, message); // eslint-disable-line no-console
    }
  }
};

exports['default'] = logger;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2xvZ2dlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O3FCQUFzQixTQUFTOztBQUUvQixJQUFJLE1BQU0sR0FBRztBQUNYLFdBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQztBQUM3QyxPQUFLLEVBQUUsTUFBTTs7O0FBR2IsYUFBVyxFQUFFLHFCQUFTLEtBQUssRUFBRTtBQUMzQixRQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtBQUM3QixVQUFJLFFBQVEsR0FBRyxlQUFRLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDOUQsVUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO0FBQ2pCLGFBQUssR0FBRyxRQUFRLENBQUM7T0FDbEIsTUFBTTtBQUNMLGFBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO09BQzdCO0tBQ0Y7O0FBRUQsV0FBTyxLQUFLLENBQUM7R0FDZDs7O0FBR0QsS0FBRyxFQUFFLGFBQVMsS0FBSyxFQUFjO0FBQy9CLFNBQUssR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUVsQyxRQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUU7QUFDL0UsVUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQyxVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztBQUNwQixjQUFNLEdBQUcsS0FBSyxDQUFDO09BQ2hCOzt3Q0FQbUIsT0FBTztBQUFQLGVBQU87OztBQVEzQixhQUFPLENBQUMsTUFBTSxPQUFDLENBQWYsT0FBTyxFQUFZLE9BQU8sQ0FBQyxDQUFDO0tBQzdCO0dBQ0Y7Q0FDRixDQUFDOztxQkFFYSxNQUFNIiwiZmlsZSI6ImxvZ2dlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aW5kZXhPZn0gZnJvbSAnLi91dGlscyc7XG5cbmxldCBsb2dnZXIgPSB7XG4gIG1ldGhvZE1hcDogWydkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InXSxcbiAgbGV2ZWw6ICdpbmZvJyxcblxuICAvLyBNYXBzIGEgZ2l2ZW4gbGV2ZWwgdmFsdWUgdG8gdGhlIGBtZXRob2RNYXBgIGluZGV4ZXMgYWJvdmUuXG4gIGxvb2t1cExldmVsOiBmdW5jdGlvbihsZXZlbCkge1xuICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsZXQgbGV2ZWxNYXAgPSBpbmRleE9mKGxvZ2dlci5tZXRob2RNYXAsIGxldmVsLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgaWYgKGxldmVsTWFwID49IDApIHtcbiAgICAgICAgbGV2ZWwgPSBsZXZlbE1hcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldmVsID0gcGFyc2VJbnQobGV2ZWwsIDEwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGV2ZWw7XG4gIH0sXG5cbiAgLy8gQ2FuIGJlIG92ZXJyaWRkZW4gaW4gdGhlIGhvc3QgZW52aXJvbm1lbnRcbiAgbG9nOiBmdW5jdGlvbihsZXZlbCwgLi4ubWVzc2FnZSkge1xuICAgIGxldmVsID0gbG9nZ2VyLmxvb2t1cExldmVsKGxldmVsKTtcblxuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbG9nZ2VyLmxvb2t1cExldmVsKGxvZ2dlci5sZXZlbCkgPD0gbGV2ZWwpIHtcbiAgICAgIGxldCBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIGlmICghY29uc29sZVttZXRob2RdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICBtZXRob2QgPSAnbG9nJztcbiAgICAgIH1cbiAgICAgIGNvbnNvbGVbbWV0aG9kXSguLi5tZXNzYWdlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBsb2dnZXI7XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/no-conflict.js":
/*!********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/no-conflict.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* global window */


exports.__esModule = true;

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
    return Handlebars;
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL25vLWNvbmZsaWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O3FCQUNlLFVBQVMsVUFBVSxFQUFFOztBQUVsQyxNQUFJLElBQUksR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLEdBQUcsTUFBTSxHQUFHLE1BQU07TUFDdEQsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRWxDLFlBQVUsQ0FBQyxVQUFVLEdBQUcsWUFBVztBQUNqQyxRQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFO0FBQ2xDLFVBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDO0tBQy9CO0FBQ0QsV0FBTyxVQUFVLENBQUM7R0FDbkIsQ0FBQztDQUNIIiwiZmlsZSI6Im5vLWNvbmZsaWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHdpbmRvdyAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oSGFuZGxlYmFycykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBsZXQgcm9vdCA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogd2luZG93LFxuICAgICAgJEhhbmRsZWJhcnMgPSByb290LkhhbmRsZWJhcnM7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIEhhbmRsZWJhcnMubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcbiAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuICAgIH1cbiAgICByZXR1cm4gSGFuZGxlYmFycztcbiAgfTtcbn1cbiJdfQ==

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/runtime.js":
/*!****************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/runtime.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.checkRevision = checkRevision;
exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = __webpack_require__(/*! ./utils */ "./node_modules/handlebars/dist/cjs/handlebars/utils.js");

var Utils = _interopRequireWildcard(_utils);

var _exception = __webpack_require__(/*! ./exception */ "./node_modules/handlebars/dist/cjs/handlebars/exception.js");

var _exception2 = _interopRequireDefault(_exception);

var _base = __webpack_require__(/*! ./base */ "./node_modules/handlebars/dist/cjs/handlebars/base.js");

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _base.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _base.REVISION_CHANGES[currentRevision],
          compilerVersions = _base.REVISION_CHANGES[compilerRevision];
      throw new _exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  templateSpec.main.decorator = templateSpec.main_d;

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
      if (options.ids) {
        options.ids[0] = true;
      }
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      var ret = templateSpec[i];
      ret.decorator = templateSpec[i + '_d'];
      return ret;
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },
    // An empty object to use as replacement for null-contexts
    nullContext: Object.seal({}),

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      if (options.depths) {
        depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
      } else {
        depths = [context];
      }
    }

    function main(context /*, options*/) {
      return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
    }
    main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
    return main(context, options);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
      if (templateSpec.usePartial || templateSpec.useDecorators) {
        container.decorators = container.merge(options.decorators, env.decorators);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
      container.decorators = options.decorators;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var currentDepths = depths;
    if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) {
      currentDepths = [context].concat(depths);
    }

    return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
  }

  prog = executeDecorators(fn, prog, container, depths, data, blockParams);

  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    if (options.name === '@partial-block') {
      partial = options.data['partial-block'];
    } else {
      partial = options.partials[options.name];
    }
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  // Use the current closure context to save the partial-block if this partial
  var currentPartialBlock = options.data && options.data['partial-block'];
  options.partial = true;
  if (options.ids) {
    options.data.contextPath = options.ids[0] || options.data.contextPath;
  }

  var partialBlock = undefined;
  if (options.fn && options.fn !== noop) {
    (function () {
      options.data = _base.createFrame(options.data);
      // Wrapper function to get access to currentPartialBlock from the closure
      var fn = options.fn;
      partialBlock = options.data['partial-block'] = function partialBlockWrapper(context) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        // Restore the partial-block from the closure for the execution of the block
        // i.e. the part inside the block of the partial call.
        options.data = _base.createFrame(options.data);
        options.data['partial-block'] = currentPartialBlock;
        return fn(context, options);
      };
      if (fn.partials) {
        options.partials = Utils.extend({}, options.partials, fn.partials);
      }
    })();
  }

  if (partial === undefined && partialBlock) {
    partial = partialBlock;
  }

  if (partial === undefined) {
    throw new _exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _base.createFrame(data) : {};
    data.root = context;
  }
  return data;
}

function executeDecorators(fn, prog, container, depths, data, blockParams) {
  if (fn.decorator) {
    var props = {};
    prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
    Utils.extend(prog, props);
  }
  return prog;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL3J1bnRpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7cUJBQXVCLFNBQVM7O0lBQXBCLEtBQUs7O3lCQUNLLGFBQWE7Ozs7b0JBQzhCLFFBQVE7O0FBRWxFLFNBQVMsYUFBYSxDQUFDLFlBQVksRUFBRTtBQUMxQyxNQUFNLGdCQUFnQixHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztNQUN2RCxlQUFlLDBCQUFvQixDQUFDOztBQUUxQyxNQUFJLGdCQUFnQixLQUFLLGVBQWUsRUFBRTtBQUN4QyxRQUFJLGdCQUFnQixHQUFHLGVBQWUsRUFBRTtBQUN0QyxVQUFNLGVBQWUsR0FBRyx1QkFBaUIsZUFBZSxDQUFDO1VBQ25ELGdCQUFnQixHQUFHLHVCQUFpQixnQkFBZ0IsQ0FBQyxDQUFDO0FBQzVELFlBQU0sMkJBQWMseUZBQXlGLEdBQ3ZHLHFEQUFxRCxHQUFHLGVBQWUsR0FBRyxtREFBbUQsR0FBRyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNoSyxNQUFNOztBQUVMLFlBQU0sMkJBQWMsd0ZBQXdGLEdBQ3RHLGlEQUFpRCxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNuRjtHQUNGO0NBQ0Y7O0FBRU0sU0FBUyxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTs7QUFFMUMsTUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNSLFVBQU0sMkJBQWMsbUNBQW1DLENBQUMsQ0FBQztHQUMxRDtBQUNELE1BQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO0FBQ3ZDLFVBQU0sMkJBQWMsMkJBQTJCLEdBQUcsT0FBTyxZQUFZLENBQUMsQ0FBQztHQUN4RTs7QUFFRCxjQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDOzs7O0FBSWxELEtBQUcsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFNUMsV0FBUyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtBQUN2RCxRQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDaEIsYUFBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEQsVUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ2YsZUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7T0FDdkI7S0FDRjs7QUFFRCxXQUFPLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3RFLFFBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFeEUsUUFBSSxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUU7QUFDakMsYUFBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN6RixZQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzNEO0FBQ0QsUUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO0FBQ2xCLFVBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNsQixZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9CLGFBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDNUMsY0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM1QixrQkFBTTtXQUNQOztBQUVELGVBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0QztBQUNELGNBQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQzNCO0FBQ0QsYUFBTyxNQUFNLENBQUM7S0FDZixNQUFNO0FBQ0wsWUFBTSwyQkFBYyxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRywwREFBMEQsQ0FBQyxDQUFDO0tBQ2pIO0dBQ0Y7OztBQUdELE1BQUksU0FBUyxHQUFHO0FBQ2QsVUFBTSxFQUFFLGdCQUFTLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDMUIsVUFBSSxFQUFFLElBQUksSUFBSSxHQUFHLENBQUEsQUFBQyxFQUFFO0FBQ2xCLGNBQU0sMkJBQWMsR0FBRyxHQUFHLElBQUksR0FBRyxtQkFBbUIsR0FBRyxHQUFHLENBQUMsQ0FBQztPQUM3RDtBQUNELGFBQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2xCO0FBQ0QsVUFBTSxFQUFFLGdCQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDN0IsVUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMxQixXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzVCLFlBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDeEMsaUJBQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hCO09BQ0Y7S0FDRjtBQUNELFVBQU0sRUFBRSxnQkFBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ2pDLGFBQU8sT0FBTyxPQUFPLEtBQUssVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDO0tBQ3hFOztBQUVELG9CQUFnQixFQUFFLEtBQUssQ0FBQyxnQkFBZ0I7QUFDeEMsaUJBQWEsRUFBRSxvQkFBb0I7O0FBRW5DLE1BQUUsRUFBRSxZQUFTLENBQUMsRUFBRTtBQUNkLFVBQUksR0FBRyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixTQUFHLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdkMsYUFBTyxHQUFHLENBQUM7S0FDWjs7QUFFRCxZQUFRLEVBQUUsRUFBRTtBQUNaLFdBQU8sRUFBRSxpQkFBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUU7QUFDbkUsVUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7VUFDakMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsVUFBSSxJQUFJLElBQUksTUFBTSxJQUFJLFdBQVcsSUFBSSxtQkFBbUIsRUFBRTtBQUN4RCxzQkFBYyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO09BQzNGLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUMxQixzQkFBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7T0FDOUQ7QUFDRCxhQUFPLGNBQWMsQ0FBQztLQUN2Qjs7QUFFRCxRQUFJLEVBQUUsY0FBUyxLQUFLLEVBQUUsS0FBSyxFQUFFO0FBQzNCLGFBQU8sS0FBSyxJQUFJLEtBQUssRUFBRSxFQUFFO0FBQ3ZCLGFBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO09BQ3ZCO0FBQ0QsYUFBTyxLQUFLLENBQUM7S0FDZDtBQUNELFNBQUssRUFBRSxlQUFTLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDN0IsVUFBSSxHQUFHLEdBQUcsS0FBSyxJQUFJLE1BQU0sQ0FBQzs7QUFFMUIsVUFBSSxLQUFLLElBQUksTUFBTSxJQUFLLEtBQUssS0FBSyxNQUFNLEFBQUMsRUFBRTtBQUN6QyxXQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ3ZDOztBQUVELGFBQU8sR0FBRyxDQUFDO0tBQ1o7O0FBRUQsZUFBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOztBQUU1QixRQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJO0FBQ2pCLGdCQUFZLEVBQUUsWUFBWSxDQUFDLFFBQVE7R0FDcEMsQ0FBQzs7QUFFRixXQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQWdCO1FBQWQsT0FBTyx5REFBRyxFQUFFOztBQUNoQyxRQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDOztBQUV4QixPQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUU7QUFDNUMsVUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDaEM7QUFDRCxRQUFJLE1BQU0sWUFBQTtRQUNOLFdBQVcsR0FBRyxZQUFZLENBQUMsY0FBYyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7QUFDL0QsUUFBSSxZQUFZLENBQUMsU0FBUyxFQUFFO0FBQzFCLFVBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNsQixjQUFNLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7T0FDM0YsTUFBTTtBQUNMLGNBQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO09BQ3BCO0tBQ0Y7O0FBRUQsYUFBUyxJQUFJLENBQUMsT0FBTyxnQkFBZTtBQUNsQyxhQUFPLEVBQUUsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDckg7QUFDRCxRQUFJLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN0RyxXQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDL0I7QUFDRCxLQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQzs7QUFFakIsS0FBRyxDQUFDLE1BQU0sR0FBRyxVQUFTLE9BQU8sRUFBRTtBQUM3QixRQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUNwQixlQUFTLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRWxFLFVBQUksWUFBWSxDQUFDLFVBQVUsRUFBRTtBQUMzQixpQkFBUyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQ3RFO0FBQ0QsVUFBSSxZQUFZLENBQUMsVUFBVSxJQUFJLFlBQVksQ0FBQyxhQUFhLEVBQUU7QUFDekQsaUJBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUM1RTtLQUNGLE1BQU07QUFDTCxlQUFTLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDcEMsZUFBUyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3RDLGVBQVMsQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztLQUMzQztHQUNGLENBQUM7O0FBRUYsS0FBRyxDQUFDLE1BQU0sR0FBRyxVQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRTtBQUNsRCxRQUFJLFlBQVksQ0FBQyxjQUFjLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDL0MsWUFBTSwyQkFBYyx3QkFBd0IsQ0FBQyxDQUFDO0tBQy9DO0FBQ0QsUUFBSSxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3JDLFlBQU0sMkJBQWMseUJBQXlCLENBQUMsQ0FBQztLQUNoRDs7QUFFRCxXQUFPLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztHQUNqRixDQUFDO0FBQ0YsU0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFTSxTQUFTLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRTtBQUM1RixXQUFTLElBQUksQ0FBQyxPQUFPLEVBQWdCO1FBQWQsT0FBTyx5REFBRyxFQUFFOztBQUNqQyxRQUFJLGFBQWEsR0FBRyxNQUFNLENBQUM7QUFDM0IsUUFBSSxNQUFNLElBQUksT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sS0FBSyxTQUFTLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUEsQUFBQyxFQUFFO0FBQ2hHLG1CQUFhLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDMUM7O0FBRUQsV0FBTyxFQUFFLENBQUMsU0FBUyxFQUNmLE9BQU8sRUFDUCxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQ3JDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxFQUNwQixXQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUN4RCxhQUFhLENBQUMsQ0FBQztHQUNwQjs7QUFFRCxNQUFJLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFekUsTUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDakIsTUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDeEMsTUFBSSxDQUFDLFdBQVcsR0FBRyxtQkFBbUIsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBTyxJQUFJLENBQUM7Q0FDYjs7QUFFTSxTQUFTLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtBQUN4RCxNQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1osUUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLGdCQUFnQixFQUFFO0FBQ3JDLGFBQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQ3pDLE1BQU07QUFDTCxhQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUM7R0FDRixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTs7QUFFekMsV0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7QUFDdkIsV0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7R0FDckM7QUFDRCxTQUFPLE9BQU8sQ0FBQztDQUNoQjs7QUFFTSxTQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTs7QUFFdkQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDMUUsU0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDdkIsTUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ2YsV0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztHQUN2RTs7QUFFRCxNQUFJLFlBQVksWUFBQSxDQUFDO0FBQ2pCLE1BQUksT0FBTyxDQUFDLEVBQUUsSUFBSSxPQUFPLENBQUMsRUFBRSxLQUFLLElBQUksRUFBRTs7QUFDckMsYUFBTyxDQUFDLElBQUksR0FBRyxrQkFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXpDLFVBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFDcEIsa0JBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLFNBQVMsbUJBQW1CLENBQUMsT0FBTyxFQUFnQjtZQUFkLE9BQU8seURBQUcsRUFBRTs7OztBQUkvRixlQUFPLENBQUMsSUFBSSxHQUFHLGtCQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QyxlQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0FBQ3BELGVBQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztPQUM3QixDQUFDO0FBQ0YsVUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0FBQ2YsZUFBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUNwRTs7R0FDRjs7QUFFRCxNQUFJLE9BQU8sS0FBSyxTQUFTLElBQUksWUFBWSxFQUFFO0FBQ3pDLFdBQU8sR0FBRyxZQUFZLENBQUM7R0FDeEI7O0FBRUQsTUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO0FBQ3pCLFVBQU0sMkJBQWMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcscUJBQXFCLENBQUMsQ0FBQztHQUM1RSxNQUFNLElBQUksT0FBTyxZQUFZLFFBQVEsRUFBRTtBQUN0QyxXQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDbEM7Q0FDRjs7QUFFTSxTQUFTLElBQUksR0FBRztBQUFFLFNBQU8sRUFBRSxDQUFDO0NBQUU7O0FBRXJDLFNBQVMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDL0IsTUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLE1BQU0sSUFBSSxJQUFJLENBQUEsQUFBQyxFQUFFO0FBQzlCLFFBQUksR0FBRyxJQUFJLEdBQUcsa0JBQVksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3JDLFFBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0dBQ3JCO0FBQ0QsU0FBTyxJQUFJLENBQUM7Q0FDYjs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO0FBQ3pFLE1BQUksRUFBRSxDQUFDLFNBQVMsRUFBRTtBQUNoQixRQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixRQUFJLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDNUYsU0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDM0I7QUFDRCxTQUFPLElBQUksQ0FBQztDQUNiIiwiZmlsZSI6InJ1bnRpbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBFeGNlcHRpb24gZnJvbSAnLi9leGNlcHRpb24nO1xuaW1wb3J0IHsgQ09NUElMRVJfUkVWSVNJT04sIFJFVklTSU9OX0NIQU5HRVMsIGNyZWF0ZUZyYW1lIH0gZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG4gIGNvbnN0IGNvbXBpbGVyUmV2aXNpb24gPSBjb21waWxlckluZm8gJiYgY29tcGlsZXJJbmZvWzBdIHx8IDEsXG4gICAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXG4gIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcbiAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuICAgICAgY29uc3QgcnVudGltZVZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuICAgICAgICAgICAgY29tcGlsZXJWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY29tcGlsZXJSZXZpc2lvbl07XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKCdUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICtcbiAgICAgICAgICAgICdQbGVhc2UgdXBkYXRlIHlvdXIgcHJlY29tcGlsZXIgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgcnVudGltZVZlcnNpb25zICsgJykgb3IgZG93bmdyYWRlIHlvdXIgcnVudGltZSB0byBhbiBvbGRlciB2ZXJzaW9uICgnICsgY29tcGlsZXJWZXJzaW9ucyArICcpLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVc2UgdGhlIGVtYmVkZGVkIHZlcnNpb24gaW5mbyBzaW5jZSB0aGUgcnVudGltZSBkb2Vzbid0IGtub3cgYWJvdXQgdGhpcyByZXZpc2lvbiB5ZXRcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGEgbmV3ZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gJyArXG4gICAgICAgICAgICAnUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgY29tcGlsZXJJbmZvWzFdICsgJykuJyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ05vIGVudmlyb25tZW50IHBhc3NlZCB0byB0ZW1wbGF0ZScpO1xuICB9XG4gIGlmICghdGVtcGxhdGVTcGVjIHx8ICF0ZW1wbGF0ZVNwZWMubWFpbikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ1Vua25vd24gdGVtcGxhdGUgb2JqZWN0OiAnICsgdHlwZW9mIHRlbXBsYXRlU3BlYyk7XG4gIH1cblxuICB0ZW1wbGF0ZVNwZWMubWFpbi5kZWNvcmF0b3IgPSB0ZW1wbGF0ZVNwZWMubWFpbl9kO1xuXG4gIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG4gIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG4gIGVudi5WTS5jaGVja1JldmlzaW9uKHRlbXBsYXRlU3BlYy5jb21waWxlcik7XG5cbiAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmhhc2gpIHtcbiAgICAgIGNvbnRleHQgPSBVdGlscy5leHRlbmQoe30sIGNvbnRleHQsIG9wdGlvbnMuaGFzaCk7XG4gICAgICBpZiAob3B0aW9ucy5pZHMpIHtcbiAgICAgICAgb3B0aW9ucy5pZHNbMF0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhcnRpYWwgPSBlbnYuVk0ucmVzb2x2ZVBhcnRpYWwuY2FsbCh0aGlzLCBwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKTtcbiAgICBsZXQgcmVzdWx0ID0gZW52LlZNLmludm9rZVBhcnRpYWwuY2FsbCh0aGlzLCBwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKTtcblxuICAgIGlmIChyZXN1bHQgPT0gbnVsbCAmJiBlbnYuY29tcGlsZSkge1xuICAgICAgb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgdGVtcGxhdGVTcGVjLmNvbXBpbGVyT3B0aW9ucywgZW52KTtcbiAgICAgIHJlc3VsdCA9IG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXShjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG4gICAgICBpZiAob3B0aW9ucy5pbmRlbnQpIHtcbiAgICAgICAgbGV0IGxpbmVzID0gcmVzdWx0LnNwbGl0KCdcXG4nKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBsaW5lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICBpZiAoIWxpbmVzW2ldICYmIGkgKyAxID09PSBsKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaW5lc1tpXSA9IG9wdGlvbnMuaW5kZW50ICsgbGluZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gbGluZXMuam9pbignXFxuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSnVzdCBhZGQgd2F0ZXJcbiAgbGV0IGNvbnRhaW5lciA9IHtcbiAgICBzdHJpY3Q6IGZ1bmN0aW9uKG9iaiwgbmFtZSkge1xuICAgICAgaWYgKCEobmFtZSBpbiBvYmopKSB7XG4gICAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ1wiJyArIG5hbWUgKyAnXCIgbm90IGRlZmluZWQgaW4gJyArIG9iaik7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqW25hbWVdO1xuICAgIH0sXG4gICAgbG9va3VwOiBmdW5jdGlvbihkZXB0aHMsIG5hbWUpIHtcbiAgICAgIGNvbnN0IGxlbiA9IGRlcHRocy5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChkZXB0aHNbaV0gJiYgZGVwdGhzW2ldW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZGVwdGhzW2ldW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBsYW1iZGE6IGZ1bmN0aW9uKGN1cnJlbnQsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgY3VycmVudCA9PT0gJ2Z1bmN0aW9uJyA/IGN1cnJlbnQuY2FsbChjb250ZXh0KSA6IGN1cnJlbnQ7XG4gICAgfSxcblxuICAgIGVzY2FwZUV4cHJlc3Npb246IFV0aWxzLmVzY2FwZUV4cHJlc3Npb24sXG4gICAgaW52b2tlUGFydGlhbDogaW52b2tlUGFydGlhbFdyYXBwZXIsXG5cbiAgICBmbjogZnVuY3Rpb24oaSkge1xuICAgICAgbGV0IHJldCA9IHRlbXBsYXRlU3BlY1tpXTtcbiAgICAgIHJldC5kZWNvcmF0b3IgPSB0ZW1wbGF0ZVNwZWNbaSArICdfZCddO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgcHJvZ3JhbXM6IFtdLFxuICAgIHByb2dyYW06IGZ1bmN0aW9uKGksIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcbiAgICAgIGxldCBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0sXG4gICAgICAgICAgZm4gPSB0aGlzLmZuKGkpO1xuICAgICAgaWYgKGRhdGEgfHwgZGVwdGhzIHx8IGJsb2NrUGFyYW1zIHx8IGRlY2xhcmVkQmxvY2tQYXJhbXMpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbiwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvZ3JhbVdyYXBwZXI7XG4gICAgfSxcblxuICAgIGRhdGE6IGZ1bmN0aW9uKHZhbHVlLCBkZXB0aCkge1xuICAgICAgd2hpbGUgKHZhbHVlICYmIGRlcHRoLS0pIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKHBhcmFtLCBjb21tb24pIHtcbiAgICAgIGxldCBvYmogPSBwYXJhbSB8fCBjb21tb247XG5cbiAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgKHBhcmFtICE9PSBjb21tb24pKSB7XG4gICAgICAgIG9iaiA9IFV0aWxzLmV4dGVuZCh7fSwgY29tbW9uLCBwYXJhbSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcbiAgICAvLyBBbiBlbXB0eSBvYmplY3QgdG8gdXNlIGFzIHJlcGxhY2VtZW50IGZvciBudWxsLWNvbnRleHRzXG4gICAgbnVsbENvbnRleHQ6IE9iamVjdC5zZWFsKHt9KSxcblxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogdGVtcGxhdGVTcGVjLmNvbXBpbGVyXG4gIH07XG5cbiAgZnVuY3Rpb24gcmV0KGNvbnRleHQsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBkYXRhID0gb3B0aW9ucy5kYXRhO1xuXG4gICAgcmV0Ll9zZXR1cChvcHRpb25zKTtcbiAgICBpZiAoIW9wdGlvbnMucGFydGlhbCAmJiB0ZW1wbGF0ZVNwZWMudXNlRGF0YSkge1xuICAgICAgZGF0YSA9IGluaXREYXRhKGNvbnRleHQsIGRhdGEpO1xuICAgIH1cbiAgICBsZXQgZGVwdGhzLFxuICAgICAgICBibG9ja1BhcmFtcyA9IHRlbXBsYXRlU3BlYy51c2VCbG9ja1BhcmFtcyA/IFtdIDogdW5kZWZpbmVkO1xuICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlRGVwdGhzKSB7XG4gICAgICBpZiAob3B0aW9ucy5kZXB0aHMpIHtcbiAgICAgICAgZGVwdGhzID0gY29udGV4dCAhPSBvcHRpb25zLmRlcHRoc1swXSA/IFtjb250ZXh0XS5jb25jYXQob3B0aW9ucy5kZXB0aHMpIDogb3B0aW9ucy5kZXB0aHM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXB0aHMgPSBbY29udGV4dF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFpbihjb250ZXh0LyosIG9wdGlvbnMqLykge1xuICAgICAgcmV0dXJuICcnICsgdGVtcGxhdGVTcGVjLm1haW4oY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcbiAgICB9XG4gICAgbWFpbiA9IGV4ZWN1dGVEZWNvcmF0b3JzKHRlbXBsYXRlU3BlYy5tYWluLCBtYWluLCBjb250YWluZXIsIG9wdGlvbnMuZGVwdGhzIHx8IFtdLCBkYXRhLCBibG9ja1BhcmFtcyk7XG4gICAgcmV0dXJuIG1haW4oY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbiAgcmV0LmlzVG9wID0gdHJ1ZTtcblxuICByZXQuX3NldHVwID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLmhlbHBlcnMsIGVudi5oZWxwZXJzKTtcblxuICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsKSB7XG4gICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsIHx8IHRlbXBsYXRlU3BlYy51c2VEZWNvcmF0b3JzKSB7XG4gICAgICAgIGNvbnRhaW5lci5kZWNvcmF0b3JzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMuZGVjb3JhdG9ycywgZW52LmRlY29yYXRvcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcbiAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgICBjb250YWluZXIuZGVjb3JhdG9ycyA9IG9wdGlvbnMuZGVjb3JhdG9ycztcbiAgICB9XG4gIH07XG5cbiAgcmV0Ll9jaGlsZCA9IGZ1bmN0aW9uKGksIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zICYmICFibG9ja1BhcmFtcykge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbignbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocyAmJiAhZGVwdGhzKSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKCdtdXN0IHBhc3MgcGFyZW50IGRlcHRocycpO1xuICAgIH1cblxuICAgIHJldHVybiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIHRlbXBsYXRlU3BlY1tpXSwgZGF0YSwgMCwgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG4gIH07XG4gIHJldHVybiByZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gIGZ1bmN0aW9uIHByb2coY29udGV4dCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IGN1cnJlbnREZXB0aHMgPSBkZXB0aHM7XG4gICAgaWYgKGRlcHRocyAmJiBjb250ZXh0ICE9IGRlcHRoc1swXSAmJiAhKGNvbnRleHQgPT09IGNvbnRhaW5lci5udWxsQ29udGV4dCAmJiBkZXB0aHNbMF0gPT09IG51bGwpKSB7XG4gICAgICBjdXJyZW50RGVwdGhzID0gW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpO1xuICAgIH1cblxuICAgIHJldHVybiBmbihjb250YWluZXIsXG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIGNvbnRhaW5lci5oZWxwZXJzLCBjb250YWluZXIucGFydGlhbHMsXG4gICAgICAgIG9wdGlvbnMuZGF0YSB8fCBkYXRhLFxuICAgICAgICBibG9ja1BhcmFtcyAmJiBbb3B0aW9ucy5ibG9ja1BhcmFtc10uY29uY2F0KGJsb2NrUGFyYW1zKSxcbiAgICAgICAgY3VycmVudERlcHRocyk7XG4gIH1cblxuICBwcm9nID0gZXhlY3V0ZURlY29yYXRvcnMoZm4sIHByb2csIGNvbnRhaW5lciwgZGVwdGhzLCBkYXRhLCBibG9ja1BhcmFtcyk7XG5cbiAgcHJvZy5wcm9ncmFtID0gaTtcbiAgcHJvZy5kZXB0aCA9IGRlcHRocyA/IGRlcHRocy5sZW5ndGggOiAwO1xuICBwcm9nLmJsb2NrUGFyYW1zID0gZGVjbGFyZWRCbG9ja1BhcmFtcyB8fCAwO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgaWYgKCFwYXJ0aWFsKSB7XG4gICAgaWYgKG9wdGlvbnMubmFtZSA9PT0gJ0BwYXJ0aWFsLWJsb2NrJykge1xuICAgICAgcGFydGlhbCA9IG9wdGlvbnMuZGF0YVsncGFydGlhbC1ibG9jayddO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdO1xuICAgIH1cbiAgfSBlbHNlIGlmICghcGFydGlhbC5jYWxsICYmICFvcHRpb25zLm5hbWUpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pYyBwYXJ0aWFsIHRoYXQgcmV0dXJuZWQgYSBzdHJpbmdcbiAgICBvcHRpb25zLm5hbWUgPSBwYXJ0aWFsO1xuICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW3BhcnRpYWxdO1xuICB9XG4gIHJldHVybiBwYXJ0aWFsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIC8vIFVzZSB0aGUgY3VycmVudCBjbG9zdXJlIGNvbnRleHQgdG8gc2F2ZSB0aGUgcGFydGlhbC1ibG9jayBpZiB0aGlzIHBhcnRpYWxcbiAgY29uc3QgY3VycmVudFBhcnRpYWxCbG9jayA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGFbJ3BhcnRpYWwtYmxvY2snXTtcbiAgb3B0aW9ucy5wYXJ0aWFsID0gdHJ1ZTtcbiAgaWYgKG9wdGlvbnMuaWRzKSB7XG4gICAgb3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoID0gb3B0aW9ucy5pZHNbMF0gfHwgb3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoO1xuICB9XG5cbiAgbGV0IHBhcnRpYWxCbG9jaztcbiAgaWYgKG9wdGlvbnMuZm4gJiYgb3B0aW9ucy5mbiAhPT0gbm9vcCkge1xuICAgIG9wdGlvbnMuZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgLy8gV3JhcHBlciBmdW5jdGlvbiB0byBnZXQgYWNjZXNzIHRvIGN1cnJlbnRQYXJ0aWFsQmxvY2sgZnJvbSB0aGUgY2xvc3VyZVxuICAgIGxldCBmbiA9IG9wdGlvbnMuZm47XG4gICAgcGFydGlhbEJsb2NrID0gb3B0aW9ucy5kYXRhWydwYXJ0aWFsLWJsb2NrJ10gPSBmdW5jdGlvbiBwYXJ0aWFsQmxvY2tXcmFwcGVyKGNvbnRleHQsIG9wdGlvbnMgPSB7fSkge1xuXG4gICAgICAvLyBSZXN0b3JlIHRoZSBwYXJ0aWFsLWJsb2NrIGZyb20gdGhlIGNsb3N1cmUgZm9yIHRoZSBleGVjdXRpb24gb2YgdGhlIGJsb2NrXG4gICAgICAvLyBpLmUuIHRoZSBwYXJ0IGluc2lkZSB0aGUgYmxvY2sgb2YgdGhlIHBhcnRpYWwgY2FsbC5cbiAgICAgIG9wdGlvbnMuZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICBvcHRpb25zLmRhdGFbJ3BhcnRpYWwtYmxvY2snXSA9IGN1cnJlbnRQYXJ0aWFsQmxvY2s7XG4gICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBpZiAoZm4ucGFydGlhbHMpIHtcbiAgICAgIG9wdGlvbnMucGFydGlhbHMgPSBVdGlscy5leHRlbmQoe30sIG9wdGlvbnMucGFydGlhbHMsIGZuLnBhcnRpYWxzKTtcbiAgICB9XG4gIH1cblxuICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkICYmIHBhcnRpYWxCbG9jaykge1xuICAgIHBhcnRpYWwgPSBwYXJ0aWFsQmxvY2s7XG4gIH1cblxuICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEV4Y2VwdGlvbignVGhlIHBhcnRpYWwgJyArIG9wdGlvbnMubmFtZSArICcgY291bGQgbm90IGJlIGZvdW5kJyk7XG4gIH0gZWxzZSBpZiAocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKSB7IHJldHVybiAnJzsgfVxuXG5mdW5jdGlvbiBpbml0RGF0YShjb250ZXh0LCBkYXRhKSB7XG4gIGlmICghZGF0YSB8fCAhKCdyb290JyBpbiBkYXRhKSkge1xuICAgIGRhdGEgPSBkYXRhID8gY3JlYXRlRnJhbWUoZGF0YSkgOiB7fTtcbiAgICBkYXRhLnJvb3QgPSBjb250ZXh0O1xuICB9XG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiBleGVjdXRlRGVjb3JhdG9ycyhmbiwgcHJvZywgY29udGFpbmVyLCBkZXB0aHMsIGRhdGEsIGJsb2NrUGFyYW1zKSB7XG4gIGlmIChmbi5kZWNvcmF0b3IpIHtcbiAgICBsZXQgcHJvcHMgPSB7fTtcbiAgICBwcm9nID0gZm4uZGVjb3JhdG9yKHByb2csIHByb3BzLCBjb250YWluZXIsIGRlcHRocyAmJiBkZXB0aHNbMF0sIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICAgIFV0aWxzLmV4dGVuZChwcm9nLCBwcm9wcyk7XG4gIH1cbiAgcmV0dXJuIHByb2c7XG59XG4iXX0=


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/safe-string.js":
/*!********************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/safe-string.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Build out our basic SafeString type


exports.__esModule = true;
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFDQSxTQUFTLFVBQVUsQ0FBQyxNQUFNLEVBQUU7QUFDMUIsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Q0FDdEI7O0FBRUQsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBVztBQUN2RSxTQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0NBQ3pCLENBQUM7O3FCQUVhLFVBQVUiLCJmaWxlIjoic2FmZS1zdHJpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBCdWlsZCBvdXQgb3VyIGJhc2ljIFNhZmVTdHJpbmcgdHlwZVxuZnVuY3Rpb24gU2FmZVN0cmluZyhzdHJpbmcpIHtcbiAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG59XG5cblNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gU2FmZVN0cmluZy5wcm90b3R5cGUudG9IVE1MID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnJyArIHRoaXMuc3RyaW5nO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2FmZVN0cmluZztcbiJdfQ==


/***/ }),

/***/ "./node_modules/handlebars/dist/cjs/handlebars/utils.js":
/*!**************************************************************!*\
  !*** ./node_modules/handlebars/dist/cjs/handlebars/utils.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.createFrame = createFrame;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

var badChars = /[&<>"'`=]/g,
    possible = /[&<>"'`=]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/* eslint-disable func-style */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
exports.isFunction = isFunction;

/* eslint-enable func-style */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function createFrame(object) {
  var frame = extend({}, object);
  frame._parent = object;
  return frame;
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNLE1BQU0sR0FBRztBQUNiLEtBQUcsRUFBRSxPQUFPO0FBQ1osS0FBRyxFQUFFLE1BQU07QUFDWCxLQUFHLEVBQUUsTUFBTTtBQUNYLEtBQUcsRUFBRSxRQUFRO0FBQ2IsS0FBRyxFQUFFLFFBQVE7QUFDYixLQUFHLEVBQUUsUUFBUTtBQUNiLEtBQUcsRUFBRSxRQUFRO0NBQ2QsQ0FBQzs7QUFFRixJQUFNLFFBQVEsR0FBRyxZQUFZO0lBQ3ZCLFFBQVEsR0FBRyxXQUFXLENBQUM7O0FBRTdCLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRTtBQUN2QixTQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNwQjs7QUFFTSxTQUFTLE1BQU0sQ0FBQyxHQUFHLG9CQUFtQjtBQUMzQyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6QyxTQUFLLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM1QixVQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDM0QsV0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUM5QjtLQUNGO0dBQ0Y7O0FBRUQsU0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFTSxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQzs7Ozs7O0FBS2hELElBQUksVUFBVSxHQUFHLG9CQUFTLEtBQUssRUFBRTtBQUMvQixTQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztDQUNwQyxDQUFDOzs7QUFHRixJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNuQixVQUlNLFVBQVUsR0FKaEIsVUFBVSxHQUFHLFVBQVMsS0FBSyxFQUFFO0FBQzNCLFdBQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssbUJBQW1CLENBQUM7R0FDcEYsQ0FBQztDQUNIO1FBQ08sVUFBVSxHQUFWLFVBQVU7Ozs7O0FBSVgsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sSUFBSSxVQUFTLEtBQUssRUFBRTtBQUN0RCxTQUFPLEFBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLGdCQUFnQixHQUFHLEtBQUssQ0FBQztDQUNqRyxDQUFDOzs7OztBQUdLLFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDcEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNoRCxRQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDdEIsYUFBTyxDQUFDLENBQUM7S0FDVjtHQUNGO0FBQ0QsU0FBTyxDQUFDLENBQUMsQ0FBQztDQUNYOztBQUdNLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0FBQ3ZDLE1BQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFOztBQUU5QixRQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQzNCLGFBQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ3hCLE1BQU0sSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO0FBQ3pCLGFBQU8sRUFBRSxDQUFDO0tBQ1gsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2xCLGFBQU8sTUFBTSxHQUFHLEVBQUUsQ0FBQztLQUNwQjs7Ozs7QUFLRCxVQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQztHQUN0Qjs7QUFFRCxNQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUFFLFdBQU8sTUFBTSxDQUFDO0dBQUU7QUFDOUMsU0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztDQUM3Qzs7QUFFTSxTQUFTLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDN0IsTUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLFdBQU8sSUFBSSxDQUFDO0dBQ2IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUMvQyxXQUFPLElBQUksQ0FBQztHQUNiLE1BQU07QUFDTCxXQUFPLEtBQUssQ0FBQztHQUNkO0NBQ0Y7O0FBRU0sU0FBUyxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQ2xDLE1BQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDL0IsT0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdkIsU0FBTyxLQUFLLENBQUM7Q0FDZDs7QUFFTSxTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ3ZDLFFBQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O0FBRU0sU0FBUyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFO0FBQ2pELFNBQU8sQ0FBQyxXQUFXLEdBQUcsV0FBVyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUEsR0FBSSxFQUFFLENBQUM7Q0FDcEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBlc2NhcGUgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmI3gyNzsnLFxuICAnYCc6ICcmI3g2MDsnLFxuICAnPSc6ICcmI3gzRDsnXG59O1xuXG5jb25zdCBiYWRDaGFycyA9IC9bJjw+XCInYD1dL2csXG4gICAgICBwb3NzaWJsZSA9IC9bJjw+XCInYD1dLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKG9iai8qICwgLi4uc291cmNlICovKSB7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yIChsZXQga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhcmd1bWVudHNbaV0sIGtleSkpIHtcbiAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG5leHBvcnQgbGV0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLy8gU291cmNlZCBmcm9tIGxvZGFzaFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuLyogZXNsaW50LWRpc2FibGUgZnVuYy1zdHlsZSAqL1xubGV0IGlzRnVuY3Rpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufTtcbi8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbmV4cG9ydCB7aXNGdW5jdGlvbn07XG4vKiBlc2xpbnQtZW5hYmxlIGZ1bmMtc3R5bGUgKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07XG5cbi8vIE9sZGVyIElFIHZlcnNpb25zIGRvIG5vdCBkaXJlY3RseSBzdXBwb3J0IGluZGV4T2Ygc28gd2UgbXVzdCBpbXBsZW1lbnQgb3VyIG93biwgc2FkbHkuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGFycmF5W2ldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuICAgIGlmIChzdHJpbmcgJiYgc3RyaW5nLnRvSFRNTCkge1xuICAgICAgcmV0dXJuIHN0cmluZy50b0hUTUwoKTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICghc3RyaW5nKSB7XG4gICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG4gICAgfVxuXG4gICAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG4gICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gICAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG4gIH1cblxuICBpZiAoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkgeyByZXR1cm4gc3RyaW5nOyB9XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShiYWRDaGFycywgZXNjYXBlQ2hhcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZyYW1lKG9iamVjdCkge1xuICBsZXQgZnJhbWUgPSBleHRlbmQoe30sIG9iamVjdCk7XG4gIGZyYW1lLl9wYXJlbnQgPSBvYmplY3Q7XG4gIHJldHVybiBmcmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG4gIHBhcmFtcy5wYXRoID0gaWRzO1xuICByZXR1cm4gcGFyYW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ29udGV4dFBhdGgoY29udGV4dFBhdGgsIGlkKSB7XG4gIHJldHVybiAoY29udGV4dFBhdGggPyBjb250ZXh0UGF0aCArICcuJyA6ICcnKSArIGlkO1xufVxuIl19


/***/ }),

/***/ "./node_modules/handlebars/runtime.js":
/*!********************************************!*\
  !*** ./node_modules/handlebars/runtime.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = __webpack_require__(/*! ./dist/cjs/handlebars.runtime */ "./node_modules/handlebars/dist/cjs/handlebars.runtime.js")['default'];


/***/ }),

/***/ "./node_modules/jquery/dist/jquery.js":
/*!********************************************!*\
  !*** ./node_modules/jquery/dist/jquery.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery JavaScript Library v3.3.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2018-01-20T17:24Z
 */
( function( global, factory ) {

	"use strict";

	if (  true && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      return typeof obj === "function" && typeof obj.nodeType !== "number";
  };


var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};




	var preservedScriptAttributes = {
		type: true,
		src: true,
		noModule: true
	};

	function DOMEval( code, doc, node ) {
		doc = doc || document;

		var i,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {
				if ( node[ i ] ) {
					script[ i ] = node[ i ];
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.3.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		DOMEval( code );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

};
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
        if ( nodeName( elem, "iframe" ) ) {
            return elem.contentDocument;
        }

        // Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
        // Treat the template element as a regular one in browsers that
        // don't support it.
        if ( nodeName( elem, "template" ) ) {
            elem = elem.content || elem;
        }

        return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			jQuery.contains( elem.ownerDocument, elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, contains, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( toType( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();
var documentElement = document.documentElement;



var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 only
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( valueIsFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), doc, node );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		div.style.position = "absolute";
		scrollboxSizeVal = div.offsetWidth === 36 || "absolute";

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function() {
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function() {
			computeStyleTests();
			return scrollboxSizeVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a property mapped along what jQuery.cssProps suggests or to
// a vendor prefixed property.
function finalPropName( name ) {
	var ret = jQuery.cssProps[ name ];
	if ( !ret ) {
		ret = jQuery.cssProps[ name ] = vendorPropName( name ) || name;
	}
	return ret;
}

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {
		return 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin
		if ( box === "margin" ) {
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {

			// For "content", subtract padding
			if ( box === "content" ) {
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5
		) );
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {

	// Start with computed style
	var styles = getStyles( elem ),
		val = curCSS( elem, dimension, styles ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox;

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {
		if ( !extra ) {
			return val;
		}
		val = "auto";
	}

	// Check for style in case a browser which returns unreliable values
	// for getComputedStyle silently falls back to the reliable elem.style
	valueIsBorderBox = valueIsBorderBox &&
		( support.boxSizingReliable() || val === elem.style[ dimension ] );

	// Fall back to offsetWidth/offsetHeight when value is "auto"
	// This happens for inline elements with no explicit setting (gh-3571)
	// Support: Android <=4.1 - 4.3 only
	// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
	if ( val === "auto" ||
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) {

		val = elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ];

		// offsetWidth/offsetHeight provide border-box values
		valueIsBorderBox = true;
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, dimension ) {
	jQuery.cssHooks[ dimension ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = getStyles( elem ),
				isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra && boxModelAdjustment(
					elem,
					dimension,
					extra,
					isBorderBox,
					styles
				);

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && support.scrollboxSize() === styles.position ) {
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( isValidValue ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = Date.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var htmlIsFunction = isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" ).prop( {
					charset: s.scriptCharset,
					src: s.url
				} ).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function( obj ) {

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( true ) {
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function() {
		return jQuery;
	}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );


/***/ }),

/***/ "./node_modules/style-loader/addStyles.js":
/*!************************************************!*\
  !*** ./node_modules/style-loader/addStyles.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
	}),
	getHeadElement = memoize(function () {
		return document.head || document.getElementsByTagName("head")[0];
	}),
	singletonElement = null,
	singletonCounter = 0;

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	var styles = listToStyles(list);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
}

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function createStyleElement() {
	var styleElement = document.createElement("style");
	var head = getHeadElement();
	styleElement.type = "text/css";
	head.appendChild(styleElement);
	return styleElement;
}

function createLinkElement() {
	var linkElement = document.createElement("link");
	var head = getHeadElement();
	linkElement.rel = "stylesheet";
	head.appendChild(linkElement);
	return linkElement;
}

function addStyle(obj, options) {
	var styleElement, update, remove;

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement());
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement();
		update = updateLink.bind(null, styleElement);
		remove = function() {
			styleElement.parentNode.removeChild(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement();
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			styleElement.parentNode.removeChild(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;
	var sourceMap = obj.sourceMap;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, obj) {
	var css = obj.css;
	var media = obj.media;
	var sourceMap = obj.sourceMap;

	if(sourceMap) {
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(sourceMap)) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./plugins/a11y-name/about.handlebars":
/*!********************************************!*\
  !*** ./plugins/a11y-name/about.handlebars ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#label-in-name\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 2.5.3 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Users that navigate by speech commands and / or text to speech will\n    have a better experience if the visual text that labels an element (not\n    just the <code>&lt;label&gt;</code> element) is the same as, or contained\n    in the programmatic label of the element. This programmatic label (also\n    known as the accessible name) includes text that is not presented visually\n    such as ARIA. Preferably the programmatic label should be the same as the\n    visual label or should start with the visual label.\n</p>\n<blockquote>\n    <a class=\"tota11y-click-to-expand\" aria-expanded=\"false\" href=\"javascript:void(0)\">\n        <p class=\"tota11y-expandable\">\n    Speech input users can navigate by speaking the visible text labels of\n    menus, links and buttons that appear on the screen. It’s confusing to\n    speech input users when they say a visible text label they see, but the\n    speech input does not work because the accessible name that is enabled as\n    a speech input command does not match the visible label.\n\n    In addition, when the accessible name is different from the visible label,\n    it essentially becomes an unknown hidden command for speech input users\n    that can be accidentally activated without the user knowing what has\n    happened.\n\n    Text-to-speech users will also have a better experience if the text they\n    hear matches the text they see on the screen.\n\n    This issue is even more important for speech input and text-to-speech users\n    who also have cognitive challenges. It’s an extra cognitive load for a\n    speech input user to remember and say a speech command that is different\n    from the visible label they see on a control. It’s also an extra cognitive\n    load for a text-to-speech user to absorb and understand speech output that\n    does not match the visible label.\n        <cite>\n            W3C\n        </cite>\n        </p>\n    </a>\n</blockquote>\n<p>\n    <a href=\"https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        Understanding \"label in name\"\n    </a>\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/a11y-name/error-template.handlebars":
/*!*****************************************************!*\
  !*** ./plugins/a11y-name/error-template.handlebars ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>\n    This <code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code> element has different visual text\n    from its programmaticly determined text. As speech input users navigate\n    by speaking the visual text of elements on the screen it is confusing\n    if the programmaticly determined text is different from the text shown\n    visually.\n</p>\n<p>\n    The programmaticly determined labelling text (accessible name) we found\n    for this element is: \"<i>"
    + alias4(((helper = (helper = helpers.extractedText || (depth0 != null ? depth0.extractedText : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"extractedText","hash":{},"data":data}) : helper)))
    + "</i>\"\n</p>\n<p>\n    The visual labelling text we found for this element\n    is: \"<i>"
    + alias4(((helper = (helper = helpers.visibleText || (depth0 != null ? depth0.visibleText : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"visibleText","hash":{},"data":data}) : helper)))
    + "</i>\"\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/TR/accname-1.1/#mapping_additional_nd_te\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        The accessible name is computed according to the steps by the W3C.\n    </a>\n</p>\n<p>\n    In short the name is recursively built up with the element's <code>\n    aria-labelledby</code> taking priority, followed by <code>aria-label</code>\n    then other labelling from the markup such as a <code>title</code> attribute\n    or an HTML <code>&lt;label&gt;</code> element.\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/a11y-name/index.js":
/*!************************************!*\
  !*** ./plugins/a11y-name/index.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("a11y-name");

let audit = __webpack_require__(/*! ../shared/audit */ "./plugins/shared/audit.js");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/a11y-name/error-template.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/a11y-name/about.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/a11y-name/style.less");

class A11yName extends Plugin {
  getName() {
    return "a11y-name";
  }

  getTitle() {
    return "Accessible names";
  }

  getDescription() {
    return "Checks visible label text is included in programmatic labels";
  }

  getAnnotate() {
    return annotate;
  }

  run() {
    $("a, input, textarea, select, button").each((i, el) => {
      // elementIsHtmlControl
      let $el = $(el); // Ignore elements that are part of the tota11y UI

      if ($el.parents(".tota11y").length > 0) {
        return;
      } // Ignore invisible elements


      if (axs.utils.elementIsTransparent(el) || axs.utils.elementHasZeroArea(el)) {
        return;
      } // Ignore elements positioned off screen


      {
        let viewportRect = el.getBoundingClientRect(); // apply the current scrolling to the bounding rectangle
        // so the values are relative to the document rather
        // than the viewport

        let rect = {
          top: viewportRect.top + window.scrollY,
          left: viewportRect.left + window.scrollX,
          right: viewportRect.right + window.scrollX,
          bottom: viewportRect.bottom + window.scrollY
        };
        let documentWidth = $(document).width();
        let documentHeight = $(document).height();

        if ((rect.left < 0 || rect.right > documentWidth) && (rect.top < 0 || rect.bottom > documentHeight)) {
          return;
        }
      } // Ignore elements that have been hidden by CSS

      if ($el.css("overflow") === "hidden" && $el.width() <= 1 && $el.height() <= 1) {
        return;
      }

      let alts = {};
      let extractedText = axs.properties.findTextAlternatives(el, alts);

      if (extractedText === null) {
        return;
      }

      const unmodifiedExtractedText = extractedText.split("").join(""); // get the texts in the element or children of the element

      let visibleText = []; // add any label text

      if (el.id) {
        visibleText.push($(`label[for=${el.id}]`).text());
      }

      if (["a", "button"].some(t => t === $el.prop("tagName").toLowerCase())) {
        // Need to use #text() on a and button elements
        visibleText.push($el.text());
      } else {
        // Need to use #val() instead of #text() on
        // inputs, textarea and select elements
        visibleText.push($el.val());
      }

      const unmodfiedVisibleText = visibleText.reduce((a, t) => a + t + " & ", "").slice(0, -3); // strip all punctuation and casing from both texts

      visibleText = visibleText.map(t => t.replace(/[\s'!#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~]/g, "").toLowerCase());
      extractedText = extractedText.replace(/[\s'!#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~]/g, "").toLowerCase();
      visibleText = visibleText.filter(t => t !== "");

      if (visibleText.length === 0) {
        return;
      }

      if (extractedText === "") {
        return;
      }

      let labelInName = visibleText.some(t => extractedText.includes(t)); // also check for the extracted text including only most of
      // the visible text to accomodate for prepended and appended
      // 'text' content that is converted to visual forms (ie arrows)

      if (!labelInName) {
        for (let text of visibleText) {
          for (let i = 0; i < text.length * 0.25 && !labelInName; i++) {
            let j = i + text.length * 0.75 - 1;
            let partialVisibleText = text.substring(i, j);

            if (partialVisibleText.length > 0 && extractedText.includes(partialVisibleText)) {
              labelInName = true;
            }
          }
        }
      }

      if (labelInName) {
        annotate.label($el, unmodifiedExtractedText).addClass("tota11y-label-success");
      } else {
        let title = "Visual & programmatic labels do not match";
        let entry = this.error(title, $(errorTemplate({
          extractedText: unmodifiedExtractedText,
          visibleText: unmodfiedVisibleText,
          elementName: $el.prop("tagName").toLowerCase()
        })), $el);
        annotate.errorLabel($el, "", title, entry);
      }
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = A11yName;

/***/ }),

/***/ "./plugins/a11y-name/style.less":
/*!**************************************!*\
  !*** ./plugins/a11y-name/style.less ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/postcss-loader/src??postcss!../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-name/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/a11y-text-wand/about.handlebars":
/*!*************************************************!*\
  !*** ./plugins/a11y-text-wand/about.handlebars ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>Screen reader wand</p>\n<p>Hover over elements to view them as a screen reader would</p>\n<p>\n    Note that real screen readers have a concept of focus (much like keyboard\n    focus) which users might navigate with by jumping to different headings,\n    links or input fields rather than in a mouse like way.\n</p>\n<p>\n    Firefox can enable Caret Browsing with F7 which is closer to the type of\n    navigation a screen reader might use.\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/a11y-text-wand/index.js":
/*!*****************************************!*\
  !*** ./plugins/a11y-text-wand/index.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/**
 * Allows users to see what screen readers would see.
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/a11y-text-wand/about.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/a11y-text-wand/style.less");

class A11yTextWand extends Plugin {
  getName() {
    return "a11y-text-wand";
  }

  getTitle() {
    return "Screen Reader Wand";
  }

  getDescription() {
    return "Hover over elements to view them as a screen reader would";
  }

  run() {
    // We provide a temporary about to force the info panel to
    // render.
    this.about($(aboutTemplate()));
    this.panel.render();
    let panel = this.panel;
    $(document).on("mousemove.wand", function (e) {
      let element = document.elementFromPoint(e.clientX, e.clientY);
      let textAlternative = axs.properties.findTextAlternatives(element, {});
      $(".tota11y-outlined").removeClass("tota11y-outlined");
      $(element).addClass("tota11y-outlined");

      if (!textAlternative) {
        panel.directRender(buildElement("i", {
          className: "tota11y-nothingness"
        }, "No text visible to a screen reader"));
      } else {
        panel.directRender(textAlternative);
      }
    });
  }

  cleanup() {
    $(".tota11y-outlined").removeClass("tota11y-outlined");
    $(document).off("mousemove.wand");
  }

}

module.exports = A11yTextWand;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./plugins/a11y-text-wand/style.less":
/*!*******************************************!*\
  !*** ./plugins/a11y-text-wand/style.less ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/postcss-loader/src??postcss!../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/a11y-text-wand/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/alt-text/about.handlebars":
/*!*******************************************!*\
  !*** ./plugins/alt-text/about.handlebars ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#text-alternatives\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.1.1 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Visual and audio information is not accessible to all users. Text\n    alternatives to audiovisual information can provide blind, deaf, hard of\n    hearing, and other users with access to the same information.\n</p>\n<p>\n    The Web Content Accessibility Guidelines list this criteria at the lowest\n    level of conformance and as first in the guidelines.\n    Providing alt text on all images is a good starting place.\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        Understanding non text content\n    </a>\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/alt-text/image-error-template.handlebars":
/*!**********************************************************!*\
  !*** ./plugins/alt-text/image-error-template.handlebars ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>\n    This image does not have an associated \"alt\" attribute.\n    Please specify a short alt text for this image like so\n    to convey the same information textually:\n</p>\n\n<pre><code>&lt;img src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " alt=\"Image description\"&gt</code></pre>\n\n<p>\n    If the image is decorative and does not convey any\n    information to the surrounding content then you should\n    leave this \"alt\" attribute empty, or specify a \"role\"\n    attribute with a value of \"presentation\" so assistive\n    technologies can ignore the image.\n</p>\n\n<pre><code>&lt;img src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " alt=\"\"&gt;\n&lt;img src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " role=\"presentation\"&gt;</code></pre>\n\n<p>\n    Extended text descriptions can be provided using <a\n            href=\"https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-describedby_attribute\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        aria-describedby\n    </a>\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/alt-text/index.js":
/*!***********************************!*\
  !*** ./plugins/alt-text/index.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to check for valid alternative representations for images
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("alt-text");

let audit = __webpack_require__(/*! ../shared/audit */ "./plugins/shared/audit.js");

let imageErrorTemplate = __webpack_require__(/*! ./image-error-template.handlebars */ "./plugins/alt-text/image-error-template.handlebars");

let inputErrorTemplate = __webpack_require__(/*! ./input-image-error-template.handlebars */ "./plugins/alt-text/input-image-error-template.handlebars");

let fallbackTextErrorTemplate = __webpack_require__(/*! ./no-fallback-text-error-template.handlebars */ "./plugins/alt-text/no-fallback-text-error-template.handlebars");

let noCaptionsErrorTemplate = __webpack_require__(/*! ./no-captions-error-template.handlebars */ "./plugins/alt-text/no-captions-error-template.handlebars");

let noAudioDescriptionErrorTemplate = __webpack_require__(/*! ./no-audio-description-error-template.handlebars */ "./plugins/alt-text/no-audio-description-error-template.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/alt-text/about.handlebars");

class AltTextPlugin extends Plugin {
  getName() {
    return "alt-text";
  }

  getTitle() {
    return "Alternative text";
  }

  getDescription() {
    return "Annotates elements without text alternatives";
  }

  getAnnotate() {
    return annotate;
  }

  reportImageError(el) {
    let $el = $(el);
    let src = $el.attr("src") || "..";
    let title = "Image is missing alt text";
    let $error = imageErrorTemplate({
      src: src
    }); // Place an error label on the element and register it as an
    // error in the info panel

    let entry = this.error(title, $error, $el);
    annotate.errorLabel($el, "", title, entry);
  }

  reportInputError(el) {
    let $el = $(el);
    let src = $el.attr("src") || "..";
    let title = "Input image is missing alt text";
    let $error = inputErrorTemplate({
      src: src
    }); // Place an error label on the element and register it as an
    // error in the info panel

    let entry = this.error(title, $error, $el);
    annotate.errorLabel($el, "", title, entry);
  }

  reportErrorFactory(_title, template) {
    return (el, elementName) => {
      let $el = $(el);
      let elementCapitalised = elementName.charAt(0).toUpperCase() + elementName.slice(1);
      let title = `${elementCapitalised} ${_title}`;
      let $error = template({
        elementName: elementName
      }); // Place an error label on the element and register it as an
      // error in the info panel

      let entry = this.error(title, $error, $el);
      annotate.errorLabel($el, "", title, entry);
    };
  }

  reportFallbackTextError(el, elementName) {
    this.reportErrorFactory("is missing text alternatives", fallbackTextErrorTemplate)(el, elementName);
  }

  reportNoCaptionsError(el, elementName) {
    this.reportErrorFactory("has no captions", noCaptionsErrorTemplate)(el, elementName);
  }

  reportNoAudioDescriptionError(el, elementName) {
    this.reportErrorFactory("has no audio descriptions", noAudioDescriptionErrorTemplate)(el, elementName);
  }

  run() {
    // Check elements for captions and/or text alternatives of any kind
    // (ie alt tags for images)
    $('audio, video, img, input[type="image"], object').each((i, el) => {
      let $el = $(el);

      if (axs.utils.isElementOrAncestorHidden(el)) {
        // skip hidden elements
        return;
      }

      if ($el.attr("role") === "presentation") {
        // ignore presentational elements
        return;
      }

      let textAlternatives = {};
      axs.properties.findTextAlternatives(el, textAlternatives); // Remove false negative when noLabel is the only key in
      // text alternatives

      delete textAlternatives["noLabel"];
      let noTextAlternatives = Object.keys(textAlternatives).length === 0;
      let elementName = $el.prop("tagName").toLowerCase();

      if (elementName === "img") {
        if (noTextAlternatives) {
          this.reportImageError(el);
        }

        return;
      }

      if (elementName === "input") {
        if (noTextAlternatives) {
          this.reportInputError(el);
        }

        return;
      }

      let hasCaptions = $el.find('track[kind="captions"]').length > 0;
      let hasAudioDescription = $el.find('track[kind="descriptions"]').length > 0;

      if (noTextAlternatives && !hasCaptions && !hasAudioDescription) {
        this.reportFallbackTextError(el, elementName);
      }

      if (elementName === "video") {
        // FIXME Detect the most suitable ARIA for indicating
        // the element is a media alternative to text, in which
        // case this test does not apply.
        if (!hasCaptions) {
          this.reportNoCaptionsError(el, elementName);
        }

        if (!hasAudioDescription) {
          this.reportNoAudioDescriptionError(el, elementName);
        }
      }
    }); // Additionally, label presentational elements

    $(`img[role="presentation"],
                img[alt=""],
                input[type="image"][alt=""],
                input[type="image"][role="presentation"],
                video[role="presentation"],
                audio[role="presentation"]`).each((i, el) => {
      // "Error" labels have a warning icon and expanded text on hover,
      // but we add a special `warning` class to color it differently.
      let $el = $(el);
      annotate.errorLabel($el, "", `This ${$el.prop("tagName").toLowerCase()} is decorative`).addClass("tota11y-label-warning");
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = AltTextPlugin;

/***/ }),

/***/ "./plugins/alt-text/input-image-error-template.handlebars":
/*!****************************************************************!*\
  !*** ./plugins/alt-text/input-image-error-template.handlebars ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>\n    This image input element does not have an associated \"alt\" attribute.\n    Please specify a short alt text for this input like so\n    to convey the same information textually:\n</p>\n\n<pre><code>&lt;input type=\"image\" src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " alt=\"Description\"&gt;&lt;/input&gt;</code></pre>\n\n<p>\n    If the image input is decorative and does not convey any\n    information to the surrounding content then you should\n    leave this \"alt\" attribute empty, or specify a \"role\"\n    attribute with a value of \"presentation\" so assistive\n    technologies can ignore the image.\n</p>\n\n<pre><code>&lt;input type=\"image\" src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " alt=\"\"&gt;&lt;/input&gt;\n&lt;input type=\"image\" src="
    + alias4(((helper = (helper = helpers.src || (depth0 != null ? depth0.src : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data}) : helper)))
    + " role=\"presentation\"&gt;&lt;/input&gt;</code></pre>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/alt-text/no-audio-description-error-template.handlebars":
/*!*************************************************************************!*\
  !*** ./plugins/alt-text/no-audio-description-error-template.handlebars ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<p>\n    This <code>&lt;"
    + container.escapeExpression(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code> element does not have an\n    audio description. You should provide an audio description with <a\n            href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        the track element\n    </a> using <code>kind=\"descriptions\"</code> which will users to access\n    timed text alternatives to visual content in media. Audio descriptions\n    should include as much meaningful visual information as possible during\n    pauses in existing dialogue such as scene changes or on-screen text that\n    is not spoken in the main soundtrack.\n</p>\n<p>\n    Audio descriptions are important for blind or visually impaired users\n    who cannot see visual information to access the full content of videos.\n</p>\n<p>\n    If all the information in video is already provided in the audio of the\n    media then no audio description is neccessary.\n</p>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                The track element\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#audio-description-or-media-alternative-prerecorded\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.2.3 (Level A)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#audio-description-prerecorded\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.2.5 (Level AA)\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/alt-text/no-captions-error-template.handlebars":
/*!****************************************************************!*\
  !*** ./plugins/alt-text/no-captions-error-template.handlebars ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<p>\n    This <code>&lt;"
    + container.escapeExpression(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code> element does not have any\n    captions. You should provide captions with <a\n            href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        the track element\n    </a> using <code>kind=\"captions\"</code> which will allow users to access\n    timed text alternatives to audio. Captions should include as much meaningful\n    audio information as possible, not just what is said but who is speaking\n    and sound descriptions.\n</p>\n<p>\n    Captions are important for deaf users and users who cannot listen\n    to audio in their current context to access the full content of videos.\n</p>\n<p>\n    Captions are not neccessary when the media is an alternative for text and\n    users can read the text instead.\n</p>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                The track element\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#captions-prerecorded\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.2.2 (Level A)\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/alt-text/no-fallback-text-error-template.handlebars":
/*!*********************************************************************!*\
  !*** ./plugins/alt-text/no-fallback-text-error-template.handlebars ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>\n    This <code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code> element does not have any\n    text alternatives. You should provide some text\n    alternatives to convey as much of the same information\n    textually as possible.\n</p>\n\n<p>\n    Brief fallback text may be given with the enclosed text\n    like so, which will also be displayed if the browser cannot\n    run the file types:\n</p>\n\n<pre><code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;Description&lt;/"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code></pre>\n\n<p>\n    Further text alternatives can be given\n    with <a href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n            target=\"_blank\" class=\"tota11y-info-link\">the track element</a> and\n    ARIA. For instance if your webpage contains the transcript of\n    the "
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " then you could use ARIA like so:\n</p>\n\n<pre><code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " aria-describedby=\"transcriptId\"&gt;</code></pre>\n\n<p>\n    If this element is purely decorative such as a background\n    video with no audio then you should specify a \"role\" attribute with a\n    value of \"presentation\" so assistive technologies can ignore the element.\n</p>\n\n<p>\n    You should not\n    use <code>role=\"presentation\"</code> or <code>aria-hidden</code> on elements\n    that users should be able to interact with, such as a video that\n    users might play, pause or mute.\n</p>\n\n<pre><code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " role=\"presentation\"&gt;</code></pre>\n\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                ARIA\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                The track element\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/base.js":
/*!*************************!*\
  !*** ./plugins/base.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/**
 * Base class for plugins.
 *
 * This module defines methods to render and mount plugins to the toolbar.
 * Each plugin will define six methods:
 *     getName: name to use for messaging to communicate to sidebar
 *     getTitle: title to display in the toolbar
 *     getDescription: description to display in the toolbar
 *     getAnnotate: gets the plugin's namespaced annotation module, if any
 *     run: code to run when the plugin is activated from the toolbar
 *     cleanup: code to run when the plugin is deactivated from the toolbar
 */
let infoPanel = __webpack_require__(/*! ./shared/info-panel */ "./plugins/shared/info-panel/index.js");

const InfoPanel = infoPanel.panel;
const isBrowser = typeof browser !== 'undefined';

__webpack_require__(/*! ./style.less */ "./plugins/style.less");

class Plugin {
  constructor() {
    this.panel = new InfoPanel(this);
    this.$checkbox = null;
  } // returns a unique identifier for this plugin with no spaces
  // or any other invalid CSS identifier characters,
  // ideally the directory name


  getName() {
    return getTitle().replace(" ", "-").toLowerCase();
  }

  getTitle() {
    return "New plugin";
  }

  getDescription() {
    return "";
  }

  getAnnotate() {
    return null;
  }
  /**
   * Methods that communicate directly with the info panel
   * TODO: Consider names like `setSummary` and `addError`
   */
  // Populates the info panel's "Summary" tab


  summary($html) {
    return this.panel.setSummary($html);
  } // Populates the info panel's "About" tab


  about($html) {
    return this.panel.setAbout($html);
  } // Adds an entry to the info panel's "Errors" tab


  error(title, $description, $el) {
    return this.panel.addError(title, $description, $el);
  }
  /**
   * Renders the plugin view.
   */


  render(clickHandler) {
    this.$checkbox = buildElement("input", {
      className: "tota11y-plugin-checkbox tota11y-sr-only",
      type: "checkbox",
      onClick: () => clickHandler(this)
    });
    let $switch = buildElement("label", {
      className: "tota11y-plugin-switch"
    }, this.$checkbox, buildElement("div", {
      "aria-hidden": "true",
      className: "tota11y-plugin-indicator"
    }, "\u2713"), buildElement("div", {
      className: "tota11y-plugin-info"
    }, buildElement("div", {
      className: "tota11y-plugin-title"
    }, this.getTitle()), buildElement("div", {
      className: "tota11y-plugin-description"
    }, this.getDescription())));
    let $el = buildElement("li", {
      role: "menuitem",
      className: "tota11y-plugin"
    }, $switch);
    return $el;
  }
  /**
   * Activate the plugin from the UI.
   */


  activate(windowId) {
    if (isBrowser) {
      this.panel.delegate(windowId);
    }

    this.run();
    this.panel.render();
  }
  /**
   * Deactivate the plugin from the UI.
   */


  deactivate() {
    this.cleanup();
    this.panel.destroy();
    this.$checkbox.prop("checked", false);
  }

}

module.exports = Plugin;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./plugins/contrast/about.handlebars":
/*!*******************************************!*\
  !*** ./plugins/contrast/about.handlebars ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div>\n<div class=\"tota11y-info-about-title\">\n    <a href=\"https://www.w3.org/TR/WCAG21/#contrast-minimum\" target=\"_blank\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.4.3 (Level AA)\n        </span>\n    </a>\n</div>\n<p>\n    Text with low contract can be hard to read for some users, particularly\n    when the text is small or in direct sunlight.\n</p>\n<p>\n    The Web Content Accessibility Guidelines give criteria for minimum text\n    contrast standards, which depend on the size of the text.\n</p>\n<p>\n    This tool cannot identify text contrast against background images or\n    in images of text but these should also meet the minimum text contrast\n    guidelines to ensure that your website is accessible to people with\n    visual impairments.\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html\"\n            class=\"tota11y-info-link\">\n        Understanding minimum contrast\n    </a>\n</p>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/contrast/error-description.handlebars":
/*!*******************************************************!*\
  !*** ./plugins/contrast/error-description.handlebars ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div>\n    <p>\n        The color combination\n        <span class=\"tota11y-color-hexes\">"
    + alias4(((helper = (helper = helpers.fgColorHex || (depth0 != null ? depth0.fgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fgColorHex","hash":{},"data":data}) : helper)))
    + "/"
    + alias4(((helper = (helper = helpers.bgColorHex || (depth0 != null ? depth0.bgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"bgColorHex","hash":{},"data":data}) : helper)))
    + "</span>\n        has a contrast ratio of <strong>"
    + alias4(((helper = (helper = helpers.contrastRatio || (depth0 != null ? depth0.contrastRatio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"contrastRatio","hash":{},"data":data}) : helper)))
    + "</strong>, which is not\n        sufficient. At this size, you will need a ratio of at least\n        <strong>"
    + alias4(((helper = (helper = helpers.requiredRatio || (depth0 != null ? depth0.requiredRatio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"requiredRatio","hash":{},"data":data}) : helper)))
    + "</strong>.\n    </p>\n\n    <p>\n        Consider using the following foreground/background combination:\n    </p>\n\n    <div class=\"tota11y-contrast-suggestion\">\n        <span class=\"tota11y-color-hexes\">\n            "
    + alias4(((helper = (helper = helpers.suggestedFgColorHex || (depth0 != null ? depth0.suggestedFgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"suggestedFgColorHex","hash":{},"data":data}) : helper)))
    + "/"
    + alias4(((helper = (helper = helpers.suggestedBgColorHex || (depth0 != null ? depth0.suggestedBgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"suggestedBgColorHex","hash":{},"data":data}) : helper)))
    + "\n        </span>\n\n        <span class=\"tota11y-swatches\">\n            <span\n                class=\"tota11y-swatch\"\n                style=\"background-color: "
    + alias4(((helper = (helper = helpers.suggestedFgColorHex || (depth0 != null ? depth0.suggestedFgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"suggestedFgColorHex","hash":{},"data":data}) : helper)))
    + " !important\">\n            </span>\n            /\n            <span\n                class=\"tota11y-swatch\"\n                style=\"background-color: "
    + alias4(((helper = (helper = helpers.suggestedBgColorHex || (depth0 != null ? depth0.suggestedBgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"suggestedBgColorHex","hash":{},"data":data}) : helper)))
    + " !important\">\n            </span>\n        </span>\n\n        has a ratio of <strong>"
    + alias4(((helper = (helper = helpers.suggestedColorsRatio || (depth0 != null ? depth0.suggestedColorsRatio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"suggestedColorsRatio","hash":{},"data":data}) : helper)))
    + "</strong>\n        <br />\n\n        <label>\n            Preview:\n            <input class=\"preview-contrast-fix\" type=\"checkbox\">\n        </label>\n    </div>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/contrast/error-title.handlebars":
/*!*************************************************!*\
  !*** ./plugins/contrast/error-title.handlebars ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "Insufficient contrast ratio ("
    + alias4(((helper = (helper = helpers.contrastRatio || (depth0 != null ? depth0.contrastRatio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"contrastRatio","hash":{},"data":data}) : helper)))
    + " &lt; "
    + alias4(((helper = (helper = helpers.requiredRatio || (depth0 != null ? depth0.requiredRatio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"requiredRatio","hash":{},"data":data}) : helper)))
    + ")\n\n<span class=\"tota11y-swatches\">\n    <span class=\"tota11y-swatch\" style=\"background-color: "
    + alias4(((helper = (helper = helpers.fgColorHex || (depth0 != null ? depth0.fgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fgColorHex","hash":{},"data":data}) : helper)))
    + " !important\"></span>\n    /\n    <span class=\"tota11y-swatch\" style=\"background-color: "
    + alias4(((helper = (helper = helpers.bgColorHex || (depth0 != null ? depth0.bgColorHex : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"bgColorHex","hash":{},"data":data}) : helper)))
    + " !important\"></span>\n</span>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/contrast/index.js":
/*!***********************************!*\
  !*** ./plugins/contrast/index.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to label different levels of contrast on the page, and highlight
 * those with poor contrast while suggesting alternatives.
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("contrast");

let titleTemplate = __webpack_require__(/*! ./error-title.handlebars */ "./plugins/contrast/error-title.handlebars");

let descriptionTemplate = __webpack_require__(/*! ./error-description.handlebars */ "./plugins/contrast/error-description.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/contrast/about.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/contrast/style.less");

class ContrastPlugin extends Plugin {
  constructor() {
    super(); // List of original colors for elements with insufficient contrast.
    // Used to restore original colors in cleanup.

    this.preservedColors = [];
  }

  getName() {
    return "contrast";
  }

  getTitle() {
    return "Contrast";
  }

  getDescription() {
    return "Labels elements with insufficient contrast";
  }

  getAnnotate() {
    return annotate;
  }

  addError({
    style,
    fgColor,
    bgColor,
    contrastRatio,
    requiredRatio
  }, el) {
    // Suggest colors at an "AA" level
    let suggestedColors = axs.color.suggestColors(bgColor, fgColor, {
      AA: requiredRatio
    }).AA;
    let templateData = {
      fgColorHex: axs.color.colorToString(fgColor),
      bgColorHex: axs.color.colorToString(bgColor),
      contrastRatio: contrastRatio,
      requiredRatio: requiredRatio,
      suggestedFgColorHex: suggestedColors.fg,
      suggestedBgColorHex: suggestedColors.bg,
      suggestedColorsRatio: suggestedColors.contrast
    }; // Add click handler to preview checkbox

    let $description = $(descriptionTemplate(templateData));
    let originalFgColor = style.color;
    let originalBgColor = style.backgroundColor;
    $description.find(".preview-contrast-fix").click(e => {
      if ($(e.target).prop("checked")) {
        // Set suggested colors
        $(el).css("color", suggestedColors.fg);
        $(el).css("background-color", suggestedColors.bg);
      } else {
        // Set original colors
        $(el).css("color", originalFgColor);
        $(el).css("background-color", originalBgColor);
      }
    });
    return this.error(titleTemplate(templateData), $description, $(el));
  }

  ptSize(style) {
    // Get the resolved value of the font size which lets
    // the browser do the work of converting em, rem, %, ect into px
    // values for us. We need the pt size as this is specified by
    // the WCAG so we use their recommended conversion factor of 1.333
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
    // https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
    return parseFloat(style.getPropertyValue("font-size")) / 1.333;
  }

  run() {
    // A map of fg/bg color pairs that we have already seen to the error
    // entry currently present in the info panel
    let combinations = {};
    $("*").each((i, el) => {
      // Only check elements with a direct text descendant
      if (!axs.properties.hasDirectTextDescendant(el)) {
        return;
      }

      let $el = $(el); // Ignore elements that are part of the tota11y UI

      if ($el.parents(".tota11y").length > 0) {
        return;
      } // Ignore invisible elements


      if (axs.utils.elementIsTransparent(el) || axs.utils.elementHasZeroArea(el)) {
        return;
      } // Ignore elements positioned off screen


      {
        let viewportRect = el.getBoundingClientRect(); // apply the current scrolling to the bounding rectangle
        // so the values are relative to the document rather
        // than the viewport

        let rect = {
          top: viewportRect.top + window.scrollY,
          left: viewportRect.left + window.scrollX,
          right: viewportRect.right + window.scrollX,
          bottom: viewportRect.bottom + window.scrollY
        };
        let documentWidth = $(document).width();
        let documentHeight = $(document).height();

        if ((rect.left < 0 || rect.right > documentWidth) && (rect.top < 0 || rect.bottom > documentHeight)) {
          return;
        }
      } // Ignore elements that have been hidden by CSS

      if ($el.css("overflow") === "hidden" && $el.width() <= 1 && $el.height() <= 1) {
        return;
      }

      let style = window.getComputedStyle(el);
      let bgColor = axs.utils.getBgColor(style, el);
      let fgColor = axs.utils.getFgColor(style, el, bgColor);
      let contrastRatio = axs.color.calculateContrastRatio(fgColor, bgColor).toFixed(2); // Calculate required ratio based on size according to WCAG
      // guidelines, bold lowers pt size needed to count as large text
      // https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

      let largeFont = this.ptSize(style) >= 18 || style.fontWeight === "bold" && this.ptSize(style) >= 14;
      let requiredRatio = largeFont ? 3.0 : 4.5; // Build a key for our `combinations` map and report the color
      // if we have not seen it yet

      let key = axs.color.colorToString(fgColor) + "/" + axs.color.colorToString(bgColor) + "/" + requiredRatio;

      if (contrastRatio >= requiredRatio) {
        // For acceptable contrast values, we don't show ratios if
        // they have been presented already
        if (!combinations[key]) {
          annotate.label($(el), contrastRatio).addClass("tota11y-label-success"); // Add the key to the combinations map. We don't have an
          // error to associate it with, so we'll just give it the
          // value of `true`.

          combinations[key] = true;
        }
      } else {
        if (!combinations[key]) {
          // We do not show duplicates in the errors panel
          // to keep the output from being overwhelming
          let error = this.addError({
            style,
            fgColor,
            bgColor,
            contrastRatio,
            requiredRatio
          }, el); // Save original color so it can be restored on cleanup.

          this.preservedColors.push({
            $el: $el,
            fg: style.color,
            bg: style.backgroundColor
          });
          combinations[key] = error;
        } // We display errors multiple times for emphasis. Each error
        // will point back to the entry in the info panel for that
        // particular color combination.
        //
        // TODO: The error entry in the info panel will only highlight
        // the first element with that color combination


        annotate.errorLabel($el, `
                    ${contrastRatio}
                    <span class="tota11y-swatches">
                        <span class="tota11y-swatch" style="background-color: ${axs.color.colorToString(fgColor)} !important"></span>
                        /
                        <span class="tota11y-swatch" style="background-color: ${axs.color.colorToString(bgColor)} !important"></span>
                    </span>
                    `, "This contrast is insufficient at this size.", combinations[key]);
      }
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    // Set all elements to original color
    this.preservedColors.forEach(entry => {
      entry.$el.css("color", entry.fg);
      entry.$el.css("background-color", entry.bg);
    });
    annotate.removeAll();
  }

}

module.exports = ContrastPlugin;

/***/ }),

/***/ "./plugins/contrast/style.less":
/*!*************************************!*\
  !*** ./plugins/contrast/style.less ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/postcss-loader/src??postcss!../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/contrast/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/document/about.handlebars":
/*!*******************************************!*\
  !*** ./plugins/document/about.handlebars ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    Meta information in HTML documents that are not visually seen on a page\n    can still be important for navigation, favicons and page titles are shown\n    in tabs to assist browsing, and page languages should be specified\n    so screen readers know what language to read text in.\n</p>\n<blockquote>\n    <p>\n        For multilingual sites targeting Conformance Level A, the Working\n        Group [WCAG authors] strongly encourages developers to follow <a\n            href=\"https://www.w3.org/TR/WCAG21/#language-of-parts\"\n            target=\"_blank\"\n            class=\"tota11y-info-link\">Success\n        Criterion 3.1.2\n        </a> as well even though that is a Level AA Success Criterion.\n        <cite>\n            W3C\n        </cite>\n    </p>\n</blockquote>\n<p>\n    This tool does not audit for specifying the language on every part of a\n    multilingual webpage which changes language as in\n    WCAG &sect; 3.1.2 (Level AA).\n</p>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#page-titled\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 2.4.2 (Level A)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#language-of-page\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 3.1.1 (Level A)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#language-of-parts\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 3.1.2 (Level AA)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/International/questions/qa-html-language-declarations\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                Declaring the language of the page\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/document/index.js":
/*!***********************************!*\
  !*** ./plugins/document/index.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*
 * A plugin to check the document metadata for the presence of important data
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let summaryTemplate = __webpack_require__(/*! ./summary-template.handlebars */ "./plugins/document/summary-template.handlebars");

let noLangErrorTemplate = __webpack_require__(/*! ./no-lang-error-template.handlebars */ "./plugins/document/no-lang-error-template.handlebars");

let noPageTitleErrorTemplate = __webpack_require__(/*! ./no-page-title-error-template.handlebars */ "./plugins/document/no-page-title-error-template.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/document/about.handlebars");

class DocumentPlugin extends Plugin {
  getName() {
    return "document";
  }

  getTitle() {
    return "Document";
  }

  getDescription() {
    return "Checks the document for the presence of important meta data";
  }

  run() {
    if (!$("html").attr("lang")) {
      this.error("No language declared", noLangErrorTemplate(), $("html"));
    }

    if (!document.title || document.title === "") {
      this.error("No page title", noPageTitleErrorTemplate(), $("head"));
    }

    this.summary(summaryTemplate({
      language: $("html").attr("lang"),
      title: document.title
    }));
    this.about($(aboutTemplate()));
  }

  cleanup() {}

}

module.exports = DocumentPlugin;

/***/ }),

/***/ "./plugins/document/no-lang-error-template.handlebars":
/*!************************************************************!*\
  !*** ./plugins/document/no-lang-error-template.handlebars ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    This document does not have a language specified on\n    its <code>&lt;html&gt;</code> element. You can specify the language like so:\n</p>\n<pre><code>&lt;html lang=\"en\"&gt;</code></pre>\n<p>\n    It is important to specify the language of the HTML document (and around\n    any text that changes language) so that assistive tools like screen readers\n    know what language to read text in.\n</p>\n<p>\n    The text for the language attribute must be a valid language code such\n    as \"<i>en</i>\" for English, \"<i>en-GB</i>\" for British English, or\n    \"<i>fr</i>\" for French.\n</p>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Learn more\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://www.w3.org/International/questions/qa-html-language-declarations\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                Declaring the language of the page\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#language-of-page\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 3.1.1 (Level A)\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/document/no-page-title-error-template.handlebars":
/*!******************************************************************!*\
  !*** ./plugins/document/no-page-title-error-template.handlebars ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    This document does not have a page title. You can provide a title like so:\n</p>\n<pre><code>&lt;head&gt;\n    &lt;title&gt;Descriptive title&lt;/title&gt;\n&lt;/head&gt;</code></pre>\n<p>\n    It is important to specify a descriptive title for every Web page for Search\n    Engine Optimisation and to help users navigate between pages.\n</p>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#page-titled\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 2.4.2 (Level A)\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/document/summary-template.handlebars":
/*!******************************************************!*\
  !*** ./plugins/document/summary-template.handlebars ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>Document language: <i>"
    + alias4(((helper = (helper = helpers.language || (depth0 != null ? depth0.language : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"language","hash":{},"data":data}) : helper)))
    + "</i></p>\n<p>Page title: \"<i>"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</i>\"</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/forms/about.handlebars":
/*!****************************************!*\
  !*** ./plugins/forms/about.handlebars ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#info-and-relationships\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.3.1 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Forms and form elements used outside of forms need a programmatically\n    accessible label (also known as the accessible name) for assistive\n    technologies to identify their purpose and so that users of these\n    technologies (like screen readers or speech input navigation) can fill them\n    in correctly. For most elements the contained text or\n    a <code>label</code> element is the best way to provide this name. Labels\n    and text inside buttons are visible by default which will also\n    help sighted users to understand the purpose of the form elements.\n</p>\n<p>\n    In some situations it might not be appropriate to use\n    a <code>label</code> element but you should still ensure the information,\n    structure and relationships visually shown can be programmatically\n    determined by using other semantic markup such as ARIA.\n</p>\n<a class=\"tota11y-click-to-expand\" aria-expanded=\"false\" href=\"javascript:void(0)\">\n    <div class=\"tota11y-expandable\">\n        <p>\n            You should not use <code>p</code> elements to label inputs as they\n            have no association.\n        </p>\n<pre><code>&lt;p&gt;\nName\n&lt;/p&gt;\n&lt;input id=\"my-input\"&gt;&lt;/input&gt;</code></pre>\n        <p>\n            The </code>label</code> element will be read out by screen readers\n            when a user interacts with the input because they are\n            programmatically associated.\n        </p>\n<pre><code>&lt;label for=\"my-input\"&gt;\nName\n&lt;/label&gt;\n&lt;input id=\"my-input\"&gt;&lt;/input&gt;</code></pre>\n        <p>\n            The <code>placeholder</code> attribute is not guaranteed to be read\n            by assistive technologies. It is better to include a proper label.\n        </p>\n<pre><code>&lt;input type=\"search\" placeholder=\"search\"&gt;&lt;/input&gt;</code></pre>\n        <p>\n            If a <label>label</label> element would not be appropriate due to\n            visual design the <code>aria-label</code> attribute can be used\n            instead to provide an accessible name to assistive tools without\n            affecting the visual presentation.\n        </p>\n<pre><code>&lt;input type=\"search\" placeholder=\"search\" aria-label=\"search\"&gt;&lt;/input&gt;</code></pre>\n        <p>\n            ARIA takes priority over other ways of determining the accessible\n            name of an element so should be used with care to avoid the\n            accessible name being completely different to the visually\n            presented label/name.\n        </p>\n    </div>\n</a>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#info-and-relationships\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.3.1 (Level A)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                Understanding Info and Relationships\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                ARIA\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/forms/alt-text-error-template.handlebars":
/*!**********************************************************!*\
  !*** ./plugins/forms/alt-text-error-template.handlebars ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<pre><code>&lt;"
    + alias4(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tagName","hash":{},"data":data}) : helper)))
    + " type=\""
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data}) : helper)))
    + "\"&gt;\n    Descriptive text here...\n&lt;/"
    + alias4(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tagName","hash":{},"data":data}) : helper)))
    + "&gt;</code></pre>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<pre><code>&lt;"
    + alias4(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tagName","hash":{},"data":data}) : helper)))
    + "&gt;\n    Descriptive text here...\n&lt;/"
    + alias4(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tagName","hash":{},"data":data}) : helper)))
    + "&gt;</code></pre>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<p>\n    Assistive technologies like screen readers will read the text contained\n    inside the "
    + container.escapeExpression(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"tagName","hash":{},"data":data}) : helper)))
    + " element. It is important to provide this text\n    and keep it up to date with the visual presentation of the element.\n</p>\n<p>\n    The simplest way to provide text to assistive technologies is by\n    including it inside the element like so:\n</p>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.type : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "");
},"useData":true});

/***/ }),

/***/ "./plugins/forms/error-template.handlebars":
/*!*************************************************!*\
  !*** ./plugins/forms/error-template.handlebars ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    return "    <p>\n        The <code>placeholder</code> attribute is not guaranteed to be read by\n        assistive technologies. It is better to include a proper label.\n    </p>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p>\n        The simplest way to do so is by creating a <code>&lt;label&gt;</code>\n        tag with a <code>for</code> attribute like so:\n    </p>\n\n    <pre><code>&lt;label for=\""
    + container.escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"data":data}) : helper)))
    + "\"&gt;\n    Label text here...\n&lt;/label&gt;</code></pre>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p>\n        You can give this element an <code>id</code> attribute and build a\n        <code>&lt;label&gt;</code> with a corresponding <code>for</code>\n        attribute like so:\n\n        <pre><code>&lt;label for=\"my-input\"&gt;\n    Label text here...\n&lt;/label&gt;\n&lt;"
    + container.escapeExpression(((helper = (helper = helpers.tagName || (depth0 != null ? depth0.tagName : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tagName","hash":{},"data":data}) : helper)))
    + " id=\"my-input\"&gt;</code></pre>\n    </p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.placeholder : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.id : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "");
},"useData":true});

/***/ }),

/***/ "./plugins/forms/index.js":
/*!********************************!*\
  !*** ./plugins/forms/index.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to identify unlabeled inputs
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("labels");

let audit = __webpack_require__(/*! ../shared/audit */ "./plugins/shared/audit.js");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/forms/error-template.handlebars");

let altTextErrorTemplate = __webpack_require__(/*! ./alt-text-error-template.handlebars */ "./plugins/forms/alt-text-error-template.handlebars");

let readOnlyClickEventErrorTemplate = __webpack_require__(/*! ./read-only-click-event-error-template.handlebars */ "./plugins/forms/read-only-click-event-error-template.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/forms/about.handlebars");

class FormsPlugin extends Plugin {
  getName() {
    return "forms";
  }

  getTitle() {
    return "Forms";
  }

  getDescription() {
    return "Identifies inputs with missing labels";
  }

  getAnnotate() {
    return annotate;
  }

  errorMessage($el) {
    return errorTemplate({
      placeholder: $el.attr("placeholder"),
      id: $el.attr("id"),
      tagName: $el.prop("tagName").toLowerCase()
    });
  }

  altTextErrorMessage($el) {
    return altTextErrorTemplate({
      id: $el.attr("id"),
      tagName: $el.prop("tagName").toLowerCase(),
      type: $el.attr("type")
    });
  }

  run() {
    // audit doesn't return elements that are decorational
    // or hidden
    let {
      result,
      elements
    } = audit("controlsWithoutLabel");

    if (result === "FAIL") {
      elements.forEach(element => {
        let $el = $(element);
        let title = "Input is missing a label";
        let tagName = $el.prop("tagName").toLowerCase();

        if (tagName === "video") {
          return;
        }

        let button = tagName === "button" || tagName === "input" && ["button", "submit", "reset"].some(t => t === $el.attr("type")); // Place an error label on the element and register it as an
        // error in the info panel

        let entry;

        if (button) {
          title = "Button has no text";
          entry = this.error(title, $(this.altTextErrorMessage($el)), $el);
        } else {
          entry = this.error(title, $(this.errorMessage($el)), $el);
        }

        annotate.errorLabel($el, "", title, entry);
      });
    }

    $("progress, meter").each((i, el) => {
      let $el = $(el);

      if ($el.attr("role") === "presentation") {
        // ignore presentational elements
        return;
      } // filter in the same way as the audit, ignoring elements "which
      // have negative tabindex and an ancestor with a widget role,
      // since they can be accessed neither with tab nor with
      // a screen reader"
      // https://github.com/GoogleChrome/accessibility-developer-tools/blob/3d7c96bf34b3146f40aeb2720e0927f221ad8725/src/audits/ControlsWithoutLabel.js#L38


      if (el.tabindex < 0) {
        return;
      }

      for (let parent = axs.dom.parentElement(el); parent != null; parent = axs.dom.parentElement(parent)) {
        if (axs.utils.elementIsAriaWidget(parent)) {
          return;
        }
      }

      let text = $el.text().trim();

      if (!axs.utils.hasLabel(el)) {
        let title = "Widget is missing a label";
        let entry = this.error(title, $(this.errorMessage($el)), $el);
        annotate.errorLabel($el, "", title, entry);
      }

      let textAlternatives = {};
      axs.properties.findTextAlternatives(el, textAlternatives);
      let noTextAlternatives = Object.keys(textAlternatives).length === 0;

      if (noTextAlternatives) {
        let title = "Widget has no text";
        let entry = this.error(title, $(this.altTextErrorMessage($el)), $el);
        annotate.errorLabel($el, "", title, entry);
      }
    });
    $("input[readonly][onclick]:not([disabled])").each((i, el) => {
      let $el = $(el);
      let title = "Read only interactive input";
      let entry = this.error(title, $(readOnlyClickEventErrorTemplate({})), $el);
      annotate.errorLabel($el, "", title, entry); // TODO
      // Check if the DevTools are open and if so send a message
      // over the Port that will trigger the devtools getEventListeners()
      // helper on these readonly input elements (via a special marking
      // class as for inspecting elements) to identify if there are any
      // click event listeners on the input that have been added
      // dynamically with JavaScript
      // https://stackoverflow.com/questions/446892/how-to-find-event-listeners-on-a-dom-node-when-debugging-or-from-the-javascript
      // As of 14/02/2019 this helper is not available to WebExtensions
      // in Firefox so this cannot be implemented yet.
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools.inspectedWindow/eval#Helpers
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = FormsPlugin;

/***/ }),

/***/ "./plugins/forms/read-only-click-event-error-template.handlebars":
/*!***********************************************************************!*\
  !*** ./plugins/forms/read-only-click-event-error-template.handlebars ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    This input is marked as read only but has a click event associated with\n    it which suggests there may be JavaScript that interacts with this input\n    to set its value (such as a popup calandar date selector).\n</p>\n<p>\n    For people using screen readers any interactive popups such as a calendar\n    wiget may not be easily noticed or accessible via tabbing through the form.\n    If this input value should be filled in by users then you should remove the\n    readonly attribute as screen reader users may try to fill it in directly via\n    the keyboard and be unable to proceed.\n</p>\n<pre><code>&lt;input&gt;<del>readonly</del> onclick=\"...\"&lt;/input&gt;</code></pre>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/headings/about.handlebars":
/*!*******************************************!*\
  !*** ./plugins/headings/about.handlebars ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#info-and-relationships\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.3.1 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Headings mark webpages with semantic information which not only orders\n    content into logical sections but also allows users of assistive tools\n    to jump through content.\n</p>\n<p>\n    This tool cannot identify if elements such as styled p tags are used\n    instead of headings (in which case they should be changed to headings of\n    the appropriate level) but can detect when headings are used incorrectly\n    such as the first heading not being <codde>h1</code> or nonconsecutive\n    heading numbers.\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        Understanding Info and Relationships\n    </a>\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/headings/index.js":
/*!***********************************!*\
  !*** ./plugins/headings/index.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/**
 * A plugin to identify and validate heading tags (<h1>, <h2>, etc.)
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("headings");

let outlineItemTemplate = __webpack_require__(/*! ./outline-item.handlebars */ "./plugins/headings/outline-item.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/headings/about.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/headings/style.less");

class HeadingLevel {
  /*
   * Constructs a heading level from a heading element (h1 - h6) or
   * any element with a heading role and an aria level (potentially >6).
   */
  constructor($el) {
    let tagName = $el.prop("tagName").toLowerCase();

    if ($el.attr("role") === "heading" && typeof $el.attr("aria-level") !== "undefined") {
      this._level = +$el.attr("aria-level");
      this._tag = `&lt;${tagName} role="heading" aria-level="${this._level}"&gt;`;
    } else {
      this._level = +tagName.slice(1);
      this._tag = `&lt;${tagName}&gt;`;
    }
  }

  tag() {
    return this._tag;
  }

  value() {
    return this._level;
  }

}

const ERRORS = {
  FIRST_NOT_H1(level) {
    return {
      title: "First heading is not an &lt;h1&gt;",
      description: `
                <div>
                    To give your document a proper structure for assistive
                    technologies, it is important to lay out your headings
                    beginning with an <code>&lt;h1&gt;</code>. We found an
                    <code>${level.tag()}</code> instead.
                </div>
            `
    };
  },

  // This error is currently unused.
  //
  // The HTML5 outlining algorithm[1] enables the use of "sectioning roots"
  // to support multiple <h1> tags when embedded inside of containers like
  // <section> or <article>. There are currently "no known implementations
  // of the outline algorithm in graphical browsers or assistive technology
  // user agents" [2], so we instead simply "use heading rank (h1-h6) to
  // convey document structure." [2].
  //
  // [1]: http://www.w3.org/html/wg/drafts/html/master/semantics.html#outline
  // [2]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Sections_and_Outlines_of_an_HTML5_document#The_HTML5_Outline_Algorithm
  MULTIPLE_H1: {
    title: "&lt;h1&gt; used when one is already present"
  },

  // This error accepts two arguments to display a relevant error message
  NONCONSECUTIVE_HEADER(prevLevel, currLevel) {
    let levelToTagCode = level => {
      if (level <= 6) {
        return `<code>&lt;h${level}&gt;</code>`;
      }

      return `<code>&lt;div role="heading" aria-level="${level}"&gt;>`;
    };

    let _tag = level => `<code>${level.tag()}</code>`;

    let description = `
            <div>
                This document contains an ${_tag(currLevel)} tag directly
                following an ${_tag(prevLevel)}. In order to maintain a consistent
                outline of the page for assistive technologies, reduce the gap in
                the heading level by upgrading this tag to an
                ${levelToTagCode(prevLevel.value() + 1)}`; // Suggest upgrading the tag to the same level as `prevLevel` iff
    // `prevLevel` is not 1

    if (prevLevel.value() !== 1) {
      description += ` or ${levelToTagCode(prevLevel.value())}`;
    }

    description += ".</div>";
    return {
      // just convert to hX for title as space is constrained even
      // if actual tag is not h1-h6
      title: `
                Nonconsecutive heading level used (h${prevLevel.value()} &rarr;
                h${currLevel.value()})
            `,
      description: description
    };
  }

};

class HeadingsPlugin extends Plugin {
  getName() {
    return "headings";
  }

  getTitle() {
    return "Headings";
  }

  getDescription() {
    return `
            Highlights headings (&lt;h1&gt;, &lt;h2&gt;, etc) and
            order violations
        `;
  }

  getAnnotate() {
    return annotate;
  }
  /**
   * Computes an outline of the page and reports any violations.
   */


  outline($headings) {
    let $items = [];
    let prevLevel = null;
    $headings.each((i, el) => {
      let $el = $(el);
      let level = new HeadingLevel($el);
      let error; // Check for any violations
      // NOTE: These violations do not overlap, but as we add more, we
      // may want to separate the conditionals here to report multiple
      // errors on the same tag.

      if (i === 0 && level.value() !== 1) {
        error = ERRORS.FIRST_NOT_H1(level); // eslint-disable-line new-cap
      } else if (prevLevel !== null && prevLevel.value() && level.value() - prevLevel.value() > 1) {
        error = ERRORS.NONCONSECUTIVE_HEADER(prevLevel, level); // eslint-disable-line new-cap
      }

      prevLevel = level; // Render the entry in the outline for the "Summary" tab

      let $item = $(outlineItemTemplate({
        // provide a numerical level which can go arbitarily high
        // and a capped level which we use for styling the element
        // that stops after 6.
        level: level.value(),
        _level: level.value() <= 6 ? level.value() : "higher",
        text: $el.text()
      }));
      $items.push($item); // Highlight the heading element on hover

      annotate.toggleHighlight($el, $item);

      if (error) {
        // Register an error to the info panel
        let infoPanelError = this.error(error.title, $(error.description), $el); // Place an error label on the heading tag

        annotate.errorLabel($el, // just convert to hX for title as space is constrained even
        // if actual tag is not h1-h6
        `h${level.value()}`, error.title, infoPanelError); // Mark the summary item as red
        // Pretty hacky, since we're borrowing label styles for this
        // summary tab

        $item.find(".tota11y-heading-outline-level").addClass("tota11y-label-error");
      } else {
        // Label the heading tag
        annotate.label($el, `h${level.value()}`).addClass("tota11y-label-success"); // Mark the summary item as green

        $item.find(".tota11y-heading-outline-level").addClass("tota11y-label-success");
      }
    });
    return $items;
  }

  run() {
    let $headings = $(`h1, h2, h3, h4, h5, h6, [role="heading"][aria-level]`); // `this.outline` has the side-effect of also reporting violations

    let $items = this.outline($headings);

    if ($items.length) {
      let $outline = buildElement("div", {
        className: "tota11y-heading-outline"
      }, $items);
      this.summary($outline);
    }

    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = HeadingsPlugin;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./plugins/headings/outline-item.handlebars":
/*!**************************************************!*\
  !*** ./plugins/headings/outline-item.handlebars ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"tota11y-heading-outline-entry heading-level-"
    + alias4(((helper = (helper = helpers._level || (depth0 != null ? depth0._level : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_level","hash":{},"data":data}) : helper)))
    + "\">\n    <span class=\"tota11y-heading-outline-level tota11y-label\">"
    + alias4(((helper = (helper = helpers.level || (depth0 != null ? depth0.level : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"level","hash":{},"data":data}) : helper)))
    + "</span>\n    <span class=\"tota11y-heading-outline-heading-text\">"
    + alias4(((helper = (helper = helpers.text || (depth0 != null ? depth0.text : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"text","hash":{},"data":data}) : helper)))
    + "</span>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/headings/style.less":
/*!*************************************!*\
  !*** ./plugins/headings/style.less ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/postcss-loader/src??postcss!../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/headings/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/index.js":
/*!**************************!*\
  !*** ./plugins/index.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * An index of plugins.
 *
 * Exposes an array of plugin instances.
 */
let A11yTextWand = __webpack_require__(/*! ./a11y-text-wand */ "./plugins/a11y-text-wand/index.js");

let A11yName = __webpack_require__(/*! ./a11y-name */ "./plugins/a11y-name/index.js");

let AltTextPlugin = __webpack_require__(/*! ./alt-text */ "./plugins/alt-text/index.js");

let ContrastPlugin = __webpack_require__(/*! ./contrast */ "./plugins/contrast/index.js");

let DocumentPlugin = __webpack_require__(/*! ./document */ "./plugins/document/index.js");

let FormsPlugin = __webpack_require__(/*! ./forms */ "./plugins/forms/index.js");

let HeadingsPlugin = __webpack_require__(/*! ./headings */ "./plugins/headings/index.js");

let LandmarksPlugin = __webpack_require__(/*! ./landmarks */ "./plugins/landmarks/index.js");

let LayoutPlugin = __webpack_require__(/*! ./layout */ "./plugins/layout/index.js");

let LinkTextPlugin = __webpack_require__(/*! ./link-text */ "./plugins/link-text/index.js");

let NavigationPlugin = __webpack_require__(/*! ./navigation */ "./plugins/navigation/index.js");

let TablesPlugin = __webpack_require__(/*! ./tables */ "./plugins/tables/index.js");

module.exports = {
  default: [new HeadingsPlugin(), new ContrastPlugin(), new LinkTextPlugin(), new FormsPlugin(), new AltTextPlugin(), new NavigationPlugin(), new LandmarksPlugin(), new TablesPlugin(), new LayoutPlugin(), new A11yName(), new DocumentPlugin()],
  experimental: [new A11yTextWand()]
};

/***/ }),

/***/ "./plugins/landmarks/about.handlebars":
/*!********************************************!*\
  !*** ./plugins/landmarks/about.handlebars ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    ARIA stands for Accessible Rich Internet Applications. ARIA is a set\n    of attributes that can supplement the normal semantics of HTML elements\n    and pass rich information to assistive technologies.\n</p>\n<p>\n    ARIA landmarks can add semantic information to existing HTML elements\n    such as <code>&lt;div role=\"search\"&gt;</code> to provide richer navigation\n    to assistive technologies and machines, though HTML5 elements which\n    have this semantic information by default should be prefered when they\n    exist. Landmarks enable users of assistive tools to skip to relevant\n    content\n</p>\n<p><strong>\n    This plugin only visualises ARIA landmarks and does not report errors.\n</strong></p>\n<p>\n    Some advice on ARIA landmarks suggests using HTML5 semantic elements and\n    redundantly specifying their role to support older browsers and assistive\n    technologies. However the ARIA standard was completed by the WC3 in 2014\n    and <a\n            href=\"https://caniuse.com/#search=article\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        the HTML5 semantic elements are widely supported apart from IE\n    </a>.\n</p>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/aria-in-html/#firstrule\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                Using ARIA\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://developer.mozilla.org/en-US/docs/Web/HTML/Element#Content_sectioning\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                HTML5 Semantic Sectioning Elements\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://a11yproject.com/posts/aria-landmark-roles/\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                Mapping between ARIA Landmark roles &amp; HTML5 elements\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/landmarks/index.js":
/*!************************************!*\
  !*** ./plugins/landmarks/index.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to label all ARIA landmark roles
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("landmarks");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/landmarks/about.handlebars");

class LandmarksPlugin extends Plugin {
  getName() {
    return "landmarks";
  }

  getTitle() {
    return "Landmarks";
  }

  getDescription() {
    return "Labels all ARIA landmarks";
  }

  getAnnotate() {
    return annotate;
  }

  run() {
    let seen = new Set();
    $("[role]:not(.tota11y-toolbar,.tota11y-plugin)").each(function () {
      annotate.label($(this), $(this).attr("role"));
      seen.add(this);
    });
    $(`aside:not(.tota11y-toolbar,.tota11y-plugin),
            footer:not(.tota11y-toolbar,.tota11y-plugin),
            form:not(.tota11y-toolbar,.tota11y-plugin),
            header:not(.tota11y-toolbar,.tota11y-plugin),
            main:not(.tota11y-toolbar,.tota11y-plugin),
            nav:not(.tota11y-toolbar,.tota11y-plugin),
            section:not(.tota11y-toolbar,.tota11y-plugin)`).each(function () {
      if (!seen.has(this)) {
        // don't label HTML5 sectioning element if element has a role
        annotate.label($(this), `&lt;${$(this).prop("tagName").toLowerCase()}&gt;`);
      }
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = LandmarksPlugin;

/***/ }),

/***/ "./plugins/layout/about.handlebars":
/*!*****************************************!*\
  !*** ./plugins/layout/about.handlebars ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    Users may modify text properties like font size or text spacing\n    on webpages with their own user style sheets to help them read so it is\n    important to ensure all text is still legible when modified.\n</p>\n<p>\n    As enlarged text may overflow elements this creates a problem if the\n    elements are styled with <code>overflow: hidden;</code> which will hide\n    overflowing text. Other elements may also obscure overflowing text.\n</p>\n<p>\n    <label>\n        Preview 200% font size:\n        <input class=\"preview-font-size\" type=\"checkbox\">\n    </label>\n</p>\n<p>\n    <label>\n        Preview modified text spacing as outlined below:\n        <input class=\"preview-text-spacing\" type=\"checkbox\">\n    </label>\n</p>\n<div class=\"tota11y-info-resources\">\n    <ul>\n        <li>Line height to at least 1.5 times the font size</li>\n        <li>Spacing following paragraphs to at least 2 times the font size</li>\n        <li>Letter spacing to at least 0.12 times the font size</li>\n        <li>Word spacing to at least 0.16 times the font size.</li>\n    </ul>\n</div>\n<div class=\"tota11y-info-resources\">\n    <p>\n        Resources\n    </p>\n    <ul>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#resize-text\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.4.4 (Level AA)\n            </a>\n        </li>\n        <li>\n            <a\n                    href=\"https://www.w3.org/TR/WCAG21/#text-spacing\"\n                    target=\"_blank\" class=\"tota11y-info-link\">\n                WCAG &sect; 1.4.12 (Level AA)\n            </a>\n        </li>\n    </ul>\n</div>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/layout/index.js":
/*!*********************************!*\
  !*** ./plugins/layout/index.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("layout");

let layoutTests = __webpack_require__(/*! ./tests */ "./plugins/layout/tests/index.js");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/layout/about.handlebars");

class LayoutPlugin extends Plugin {
  constructor() {
    super();
  }

  getName() {
    return "layout";
  }

  getTitle() {
    return "Layout";
  }

  getDescription() {
    return `
            Checks the page layout is robust to user style sheets and other
            modifications
        `;
  }

  getAnnotate() {
    return annotate;
  }

  run() {
    layoutTests.forEach(test => {
      test.apply();
      test.detect();
      test.cleanup();
    });
    layoutTests.forEach(test => {
      test.report(this.panel);
    });
    let $about = $(aboutTemplate());
    layoutTests.forEach(test => {
      let previewClass = test.getPreviewClass();

      if (previewClass) {
        $about.find(`.${previewClass}`).click(e => {
          if ($(e.target).prop("checked")) {
            test.apply();
          } else {
            test.cleanup();
          }

          annotate.refreshAll();
        });
      }
    });
    this.about($about);
  }

  cleanup() {
    layoutTests.forEach(test => {
      test.cleanup();
    });
    annotate.removeAll();
  }

}

module.exports = LayoutPlugin;

/***/ }),

/***/ "./plugins/layout/tests/base.js":
/*!**************************************!*\
  !*** ./plugins/layout/tests/base.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

class LayoutTest {
  /*
   *  Applies a layout modification to the page.
   */
  apply() {}
  /*
   * Detects any problems the layout modification revealed.
   */


  detect() {}
  /*
   * Restores the page to before applying the layout modification.
   */


  cleanup() {}
  /*
   * Reports any problems detected.
   */


  report(infoPanel) {}
  /*
   * Gets the class used for a preview checkbox to visualise the
   * apply() function to the user.
   */


  getPreviewClass() {}

}

module.exports = LayoutTest;

/***/ }),

/***/ "./plugins/layout/tests/font-size/error-template.handlebars":
/*!******************************************************************!*\
  !*** ./plugins/layout/tests/font-size/error-template.handlebars ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowY : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows horizontally and vertically when\n            enlarged and is likely partially hidden.\n        </p>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows horizontally when enlarged\n            and is likely partially hidden.\n        </p>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowY : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows vertically when enlarged\n            and is likely partially hidden.\n        </p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowX : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + "<p>\n    Users may modify the font size on webpages to help them read so it is\n    important to ensure all text is still legible when enlarged up to 200%.\n</p>\n<label>\n    Preview 200% font size:\n    <input class=\"preview-font-size\" type=\"checkbox\">\n</label>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#resize-text\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 1.4.4 (Level AA)\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/layout/tests/font-size/index.js":
/*!*************************************************!*\
  !*** ./plugins/layout/tests/font-size/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let annotate = __webpack_require__(/*! ../../../shared/annotate */ "./plugins/shared/annotate/index.js")("layout");

let LayoutTest = __webpack_require__(/*! ../base */ "./plugins/layout/tests/base.js");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/layout/tests/font-size/error-template.handlebars");

class FontSizeLayoutTest extends LayoutTest {
  constructor() {
    super();
    this.textElements = [];
    this.applied = false;
    this.$checkboxes = [];
  }

  apply() {
    this.$checkboxes.forEach(c => c.prop("checked", true));

    if (this.applied) {
      return;
    }

    this.textElements = [];
    $("*").each((i, el) => {
      // Only check elements with a direct text descendant
      if (!axs.properties.hasDirectTextDescendant(el)) {
        return;
      }

      let $el = $(el); // Ignore elements that are part of the tota11y UI

      if ($el.parents(".tota11y").length > 0) {
        return;
      } // Get the resolved font size normalised to pixels using
      // getComputedStyle so the browser does CSS unit conversion
      // work for us, and also get the style specified on the
      // element in whatever CSS unit to restore the font size to


      let style = window.getComputedStyle(el);
      let pxFontSize = parseFloat(style.getPropertyValue("font-size")); // Save original font size so it can be restored on cleanup.

      this.textElements.push({
        $el: $el,
        pxFontSize: pxFontSize,
        hasInlineFontSize: !!el.style.fontSize,
        overflow: this.isOverflow($el)
      });
    }); // Apply font size changes after querying the computed font size
    // of all elements to ignore these values changing as we resize elements

    this.textElements.forEach(entry => {
      entry.$el.css("font-size", `${entry.pxFontSize * 2}px`);
    });
    this.applied = true;
  }

  reportError($el, overflows, infoPanel) {
    let $description = $(errorTemplate({
      overflowX: overflows.x,
      overflowY: overflows.y
    }));
    let entry = infoPanel.addError("Overflows at 200% font size", $description, $el);
    let $checkbox = $description.find(".preview-font-size");
    $checkbox.click(e => {
      if ($(e.target).prop("checked")) {
        this.apply();
      } else {
        this.cleanup();
      }

      annotate.refreshAll();
    });
    this.$checkboxes.push($checkbox);
    annotate.errorLabel(entry.$el, "", "Overflows at 200%", entry);
  }

  detect() {
    this.textElements.forEach(entry => {
      let overflow = this.isOverflow(entry.$el);

      if (!entry.overflow.x && overflow.x || !entry.overflow.y && overflow.y) {
        // resizing has caused overflow that wasn't present before
        entry.error = infoPanel => {
          this.reportError(entry.$el, overflow, infoPanel);
        };
      }
    });
  }

  cleanup() {
    this.$checkboxes.forEach(c => c.prop("checked", false));

    if (!this.applied) {
      return;
    } // Set all elements to original size


    this.textElements.forEach(entry => {
      // Remove the inline style we added unless the inline style
      // we added overrided an existing inline style in which case
      // apply it again.
      if (entry.hasInlineFontSize) {
        entry.$el.css("font-size", `${entry.pxFontSize}px`);
      } else {
        entry.$el.css("font-size", "");
      }
    });
    this.applied = false;
  }

  report(infoPanel) {
    this.textElements.forEach(entry => {
      if (entry.error) {
        entry.error(infoPanel);
      }
    });
  }

  getPreviewClass() {
    return "preview-font-size";
  }

  isOverflow($el) {
    let el = $el[0];
    let style = window.getComputedStyle(el); // Filter overflow detection to only for elements that will
    // be visually cut off if they overflow, as otherwise most of
    // the overflowing and still visible elements are not actually
    // any problems and create a lot of noise.

    let cutsOff = {
      x: style.getPropertyValue("overflow-x") === "hidden",
      y: style.getPropertyValue("overflow-y") === "hidden" // Allow a 20% threshold of 'overflow' as otherwise
      // the false positive rate is very high with many elements in visual
      // terms not cut off at all.

    };
    let overflow = {
      x: el.scrollWidth > el.offsetWidth * 1.2,
      y: el.scrollHeight > el.offsetHeight * 1.2
    };
    return {
      x: cutsOff.x && overflow.x,
      y: cutsOff.y && overflow.y
    };
  }

}

module.exports = FontSizeLayoutTest;

/***/ }),

/***/ "./plugins/layout/tests/index.js":
/*!***************************************!*\
  !*** ./plugins/layout/tests/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let FontSizeLayoutTest = __webpack_require__(/*! ./font-size */ "./plugins/layout/tests/font-size/index.js");

let TextSpacingLayoutTest = __webpack_require__(/*! ./text-spacing */ "./plugins/layout/tests/text-spacing/index.js");

module.exports = [new FontSizeLayoutTest(), new TextSpacingLayoutTest()];

/***/ }),

/***/ "./plugins/layout/tests/text-spacing/error-template.handlebars":
/*!*********************************************************************!*\
  !*** ./plugins/layout/tests/text-spacing/error-template.handlebars ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowY : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows horizontally and vertically when\n            the letter, word and lineheight spacing is increased\n            and is likely partially hidden.\n        </p>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows horizontally when\n            the letter, word and lineheight spacing is increased\n            and is likely partially hidden.\n        </p>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowY : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            This element's text overflows vertically when\n            the letter, word and lineheight spacing is increased\n            and is likely partially hidden.\n        </p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.overflowX : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + "<p>\n    Users may modify text spacing values on webpages to help them read so it is\n    important to ensure all text is still legible when all of the following\n    is applied:\n</p>\n<div class=\"tota11y-info-resources\">\n    <ul>\n        <li>Line height to at least 1.5 times the font size</li>\n        <li>Spacing following paragraphs to at least 2 times the font size</li>\n        <li>Letter spacing to at least 0.12 times the font size</li>\n        <li>Word spacing to at least 0.16 times the font size.</li>\n    </ul>\n</div>\n<label>\n    Preview modified text spacing (minimums):\n    <input class=\"preview-text-spacing\" type=\"checkbox\">\n</label>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#text-spacing\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 1.4.12 (Level AA)\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/layout/tests/text-spacing/index.js":
/*!****************************************************!*\
  !*** ./plugins/layout/tests/text-spacing/index.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let annotate = __webpack_require__(/*! ../../../shared/annotate */ "./plugins/shared/annotate/index.js")("layout");

let LayoutTest = __webpack_require__(/*! ../base */ "./plugins/layout/tests/base.js");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/layout/tests/text-spacing/error-template.handlebars");

class TextSpacingLayoutTest extends LayoutTest {
  constructor() {
    super();
    this.textElements = [];
    this.applied = false;
    this.$checkboxes = [];
  }

  apply() {
    this.$checkboxes.forEach(c => c.prop("checked", true));

    if (this.applied) {
      return;
    }

    this.textElements = [];
    $("*").each((i, el) => {
      // Only check elements with a direct text descendant
      if (!axs.properties.hasDirectTextDescendant(el)) {
        return;
      }

      let $el = $(el); // Ignore elements that are part of the tota11y UI

      if ($el.parents(".tota11y").length > 0) {
        return;
      } // Get the resolved font size normalised to pixels using
      // getComputedStyle so the browser does CSS unit conversion
      // work for us, and also get the style specified on the
      // element in whatever CSS unit to restore the font size to


      let style = window.getComputedStyle(el);
      let pxFontSize = parseFloat(style.getPropertyValue("font-size")); // Save font sizes and original styles for use in applying
      // and reverting spacing styles.

      this.textElements.push({
        $el: $el,
        pxFontSize: pxFontSize,
        overflow: this.isOverflow($el),
        lineHeight: style.getPropertyValue("line-height"),
        hasInlineLineHeight: !!el.style.lineHeight,
        letterSpacing: style.getPropertyValue("letter-spacing"),
        hasInlineLetterSpacing: !!el.style.letterSpacing,
        wordSpacing: style.getPropertyValue("word-spacing"),
        hasInlineWordSpacing: !!el.style.inlineWordSpacing
      });
    }); // Apply style changes after querying the computed font size
    // of all elements to ignore these values changing as we modify elements

    this.textElements.forEach(entry => {
      entry.$el.css("line-height", `${entry.pxFontSize * 1.5}px`);
      entry.$el.css("letter-spacing", `${entry.pxFontSize * 0.12}px`);
      entry.$el.css("word-spacing", `${entry.pxFontSize * 0.16}px`); // TODO spacing following paragraphs to at least 2 times font size
    });
    this.applied = true;
  }

  reportError($el, overflows, infoPanel) {
    let $description = $(errorTemplate({
      overflowX: overflows.x,
      overflowY: overflows.y
    }));
    let entry = infoPanel.addError("Overflows with increased text spacing", $description, $el);
    let $checkbox = $description.find(".preview-text-spacing");
    $checkbox.click(e => {
      if ($(e.target).prop("checked")) {
        this.apply();
      } else {
        this.cleanup();
      }

      annotate.refreshAll();
    });
    this.$checkboxes.push($checkbox);
    annotate.errorLabel(entry.$el, "", "Overflows with increased spacing", entry);
  }

  detect() {
    this.textElements.forEach(entry => {
      let overflow = this.isOverflow(entry.$el);

      if (!entry.overflow.x && overflow.x || !entry.overflow.y && overflow.y) {
        // adjusting spacing has caused overflow that wasn't present
        // before
        entry.error = infoPanel => {
          this.reportError(entry.$el, overflow, infoPanel);
        };
      }
    });
  }

  cleanup() {
    this.$checkboxes.forEach(c => c.prop("checked", false));

    if (!this.applied) {
      return;
    } // Set all elements to original size


    this.textElements.forEach(entry => {
      // Remove the inline styles we added unless the inline styles
      // we added overrided existing inline styles in which case
      // apply them again.
      if (entry.hasInlineLineHeight) {
        entry.$el.css("line-height", entry.lineHeight);
      } else {
        entry.$el.css("line-height", "");
      }

      if (entry.hasInlineLetterSpacing) {
        entry.$el.css("letter-spacing", entry.letterSpacing);
      } else {
        entry.$el.css("letter-spacing", "");
      }

      if (entry.hasInlineWordSpacing) {
        entry.$el.css("word-spacing", entry.wordSpacing);
      } else {
        entry.$el.css("word-spacing", "");
      }
    });
    this.applied = false;
  }

  report(infoPanel) {
    this.textElements.forEach(entry => {
      if (entry.error) {
        entry.error(infoPanel);
      }
    });
  }

  getPreviewClass() {
    return "preview-text-spacing";
  }

  isOverflow($el) {
    let el = $el[0];
    let style = window.getComputedStyle(el); // Filter overflow detection to only for elements that will
    // be visually cut off if they overflow, as otherwise most of
    // the overflowing and still visible elements are not actually
    // any problems and create a lot of noise.

    let cutsOff = {
      x: style.getPropertyValue("overflow-x") === "hidden",
      y: style.getPropertyValue("overflow-y") === "hidden" // Allow a 20% threshold of 'overflow' as otherwise
      // the false positive rate is very high with many elements in visual
      // terms not cut off at all.

    };
    let overflow = {
      x: el.scrollWidth > el.offsetWidth * 1.2,
      y: el.scrollHeight > el.offsetHeight * 1.2
    };
    return {
      x: cutsOff.x && overflow.x,
      y: cutsOff.y && overflow.y
    };
  }

}

module.exports = TextSpacingLayoutTest;

/***/ }),

/***/ "./plugins/link-text/about.handlebars":
/*!********************************************!*\
  !*** ./plugins/link-text/about.handlebars ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>\n    Screen readers can pull all links out of a page and present them\n    in a single list but this loses all context information so the links must be\n    understandable from their link text alone for this type of navigation.\n</p>\n<p>\n    Even when users navigate through content sequentially any context which\n    depends on visual presentation will be lost to a screen reader so it is\n    preferable to provide link text that makes links understandable with no\n    context, or at least with immediately surrounding context such as a parent\n    <code>&lt;p&gt;</code> element.\n</p>\n<p><a\n        href=\"https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    Understanding link purpose in context\n</a></p>\n<p><a\n        href=\"https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-link-only.html\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    Understanding link purpose with no context\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/link-text/in-context-error-template.handlebars":
/*!****************************************************************!*\
  !*** ./plugins/link-text/in-context-error-template.handlebars ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    return "    You can also provide link text via the image element's alt text\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<p>\n    The link text and surrounding context we found for this\n    link \"<i>"
    + container.escapeExpression(((helper = (helper = helpers.extractedText || (depth0 != null ? depth0.extractedText : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extractedText","hash":{},"data":data}) : helper)))
    + "</i>\" is unclear despite the surrounding context\n    and may be confusing to screen readers. Consider rearranging the <code>\n    &lt;a&gt;&lt;/a&gt;</code> tags or including special screen reader text\n    such as <code>aria-label=\"detailed description\"</code> or <code>\n    aria-labelledby=\"labeling element id\"</code> in the <code>\n    &lt;a&gt;</code> element to provide more context.\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.linkedImage : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</p>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#link-purpose-in-context\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 2.4.4 (Level A)\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/link-text/index.js":
/*!************************************!*\
  !*** ./plugins/link-text/index.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to identify unclear link text such as "more" and "click here,"
 * which can make for a bad experience when using a screen reader
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("link-text");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/link-text/about.handlebars");

let inContextErrorTemplate = __webpack_require__(/*! ./in-context-error-template.handlebars */ "./plugins/link-text/in-context-error-template.handlebars");

let linkOnlyErrorTemplate = __webpack_require__(/*! ./link-only-error-template.handlebars */ "./plugins/link-text/link-only-error-template.handlebars");

let stopWords = ["click", "tap", "go", "here", "learn", "more", "this", "page", "link"]; // Generate a regex to match each of the stopWords

let stopWordsRE = new RegExp(`\\b(${stopWords.join("|")})\\b`, "ig");
/*
 * JavaScript does not yet natively support unicode aware regex
 * everywhere.
 *
 * As all we need to do is strip out any punctuation this
 * extremely long string matches all punctuation in a regex.
 */

let punctuation = `\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_\`{|}~`; // eslint-disable-line quotes
// This does not match numbers in the text.
// Removing numbers creates false positives if a link text really is
// about 5,789,911 things or a page number.

let matchNonAlphanumericRE = new RegExp(`[${punctuation} ]`, "g");

class LinkTextPlugin extends Plugin {
  getName() {
    return "link-text";
  }

  getTitle() {
    return "Link text";
  }

  getDescription() {
    return `
            Identifies links that may be confusing when read by a screen
            reader
        `;
  }

  getAnnotate() {
    return annotate;
  }
  /**
   * Modified unclear text checking that has been refactored into
   * a single method to be called with arbitrary strings.
   *
   * Original: https://github.com/GoogleChrome/accessibility-developer-tools/blob/9183b21cb0a02f5f04928f5cb7cb339b6bbc9ff8/src/audits/LinkWithUnclearPurpose.js#L55-67
   */


  isDescriptiveText(textContent) {
    // Handle when the text is undefined or null
    if (typeof textContent === "undefined" || textContent === null) {
      return false;
    }

    textContent = textContent // Strip punctuation and spaces
    .replace(matchNonAlphanumericRE, "") // Remove the stopWords
    .replace(stopWordsRE, ""); // Return whether or not there is any text left

    return textContent.trim() !== "";
  }

  reportError($el, $description, content, withContext) {
    let context = withContext ? "with context" : "without context";

    if (content === null) {
      let entry = this.error(`No link text present ${context}`, $description, $el);
      annotate.errorLabel($el, "", `No link text ${context}`, entry);
    } else {
      let entry = this.error(`Link text is unclear ${context}`, $description, $el);
      annotate.errorLabel($el, "", `Link text "${content}" is unclear ${context}`, entry);
    }
  }
  /**
   * We can call linkWithUnclearPurpose from ADT directly once the following
   * issue has been resolved. There is some extra code here until then.
   * https://github.com/GoogleChrome/accessibility-developer-tools/issues/156
   */


  run() {
    $("a").each((i, el) => {
      let $el = $(el); // Ignore the tota11y UI

      if ($el.parents(".tota11y").length) {
        return;
      } // Ignore hidden links


      if (axs.utils.isElementOrAncestorHidden(el)) {
        return;
      } // Ignore non links


      if (el.href === "") {
        return;
      } // Extract the text alternatives for this element: including
      // its text content, aria-label/labelledby, and alt text for
      // images.
      //
      // TODO: Read from `alts` to determine where the text is coming
      // from (for tailored error messages)


      let alts = {};
      let extractedTextLinkOnly = axs.properties.findTextAlternatives(el, alts); // "In HTML, information that is programmatically determinable
      // from a link in English includes text that is in the same
      // paragraph, list, or table cell as the link or in a table header
      // cell that is associated with the table cell that contains the
      // link"
      // https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html

      let $context = $el.closest("p, li, td, th");
      let extractedTextInContext = extractedTextLinkOnly;

      if ($context[0]) {
        let _alts = {};
        extractedTextInContext = axs.properties.findTextAlternatives($context[0], _alts);
      } else {
        // try to get context from a parent div instead
        $context = $el.closest("div");

        if ($context[0]) {
          let _alts = {};
          extractedTextInContext = axs.properties.findTextAlternatives($context[0], _alts);
        } else {
          // no context found
          $context = $el;
        }
      }

      if (!this.isDescriptiveText(extractedTextInContext)) {
        let $description = inContextErrorTemplate({
          extractedText: extractedTextLinkOnly,
          linkedImage: $el.find("img").length > 0
        });
        this.reportError($context, $description, extractedTextInContext, true);
      } else {
        // Context can only add information so if a link is
        // unclear with context it would also be unclear without
        // so this test is only useful if the link is descriptive
        // with context
        if (!this.isDescriptiveText(extractedTextLinkOnly)) {
          let $description = linkOnlyErrorTemplate({
            extractedText: extractedTextLinkOnly,
            linkedImage: $el.find("img").length > 0
          });
          this.reportError($el, $description, extractedTextLinkOnly, false);
        }
      }
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = LinkTextPlugin;

/***/ }),

/***/ "./plugins/link-text/link-only-error-template.handlebars":
/*!***************************************************************!*\
  !*** ./plugins/link-text/link-only-error-template.handlebars ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    return "    You can also provide link text via the image element's alt text\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<p>\n    The text \"<i>"
    + container.escapeExpression(((helper = (helper = helpers.extractedText || (depth0 != null ? depth0.extractedText : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"extractedText","hash":{},"data":data}) : helper)))
    + "</i>\" is unclear without context and may be\n    confusing to screen readers. Consider rearranging the <code>\n    &lt;a&gt;&lt;/a&gt;</code> tags or including special screen reader text\n    such as <code>aria-label=\"detailed description\"</code> or <code>\n    aria-labelledby=\"labeling element id\"</code> in the <code>\n    &lt;a&gt;</code> element to provide more context.\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.linkedImage : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</p>\n<p>\n    Screen readers can pull all links out of a page and present them\n    in a single list but this loses all context information so the links must be\n    understandable from their link text alone for this type of navigation.\n</p>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#link-purpose-link-only\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 2.4.9 (Level AAA)\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/navigation/about.handlebars":
/*!*********************************************!*\
  !*** ./plugins/navigation/about.handlebars ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#audio-control\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.4.2 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Screen readers enable users to interact with websites through speech\n    output, however this becomes difficult if the webpage is already playing\n    audio. The recommended approach is to design an action that starts playing\n    sound rather an action to stop sound that plays automatically.\n</p>\n<p>\n    Note: <a\n        href=\"https://hacks.mozilla.org/2019/02/firefox-66-to-block-automatically-playing-audible-video-and-audio/\"\n        target=\"_blank\"\n        class=\"tota11y-info-link\">Firefox 66+ blocks autoplay by default\n    </a>, as might some assistive tools\n</p>\n<p><a\n        href=\"https://www.w3.org/WAI/WCAG21/Understanding/audio-control.html\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    Understanding audio control\n</a></p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/navigation/error-template.handlebars":
/*!******************************************************!*\
  !*** ./plugins/navigation/error-template.handlebars ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>\n    This <code>&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code> element plays audio automatically\n    for more than 3 seconds with no controls provided to turn the audio off.\n    Audio output can interfere with users navigating a page with screen readers\n    and may interfere with their ability to navigatate to stop it.\n    Please either make the audio be started by a user action (prefered) or\n    provide controls for this element so that the audio can be stopped like so:\n</p>\n<pre><code>Mute by default\n&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " autoplay <ins>muted</ins>&gt;&lt;/"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;\nRemove autoplay attribute\n&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " <del>autoplay</del>&gt;&lt;/"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;\nProvide controls\n&lt;"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + " autoplay <ins>controls</ins>&gt;&lt;/"
    + alias4(((helper = (helper = helpers.elementName || (depth0 != null ? depth0.elementName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"elementName","hash":{},"data":data}) : helper)))
    + "&gt;</code></pre>\n<p><a\n        href=\"https://www.w3.org/TR/WCAG21/#audio-control\"\n        target=\"_blank\" class=\"tota11y-info-link\">\n    WCAG &sect; 1.4.2 (Level A)\n</a></p>\n<p>\n    Note: Firefox 66+ blocks autoplay by default, as might some assistive tools\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/navigation/index.js":
/*!*************************************!*\
  !*** ./plugins/navigation/index.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("navigation");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/navigation/error-template.handlebars");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/navigation/about.handlebars");

class NavigationPlugin extends Plugin {
  getName() {
    return "navigation";
  }

  getTitle() {
    return "Navigation";
  }

  getDescription() {
    return "Detects elements on the page that may interfere with navigation";
  }

  getAnnotate() {
    return annotate;
  }

  reportError($el) {
    let $description = errorTemplate({
      elementName: $el.prop("tagName").toLowerCase()
    });
    let entry = this.error("Autoplaying audio", $description, $el);
    annotate.errorLabel($el, "", "Autoplaying audio", entry);
  }

  run() {
    $("audio[autoplay], video[autoplay]").filter((i, el) => {
      // Keep only audio and video elements that have audio
      // lasting more than 3 seconds, no controls to mute
      // the audio and are not muted by default
      return !el.controls && (el.duration <= 3 || el.loop) // FIXME: Firefox disables this JS API by default, locked
      // behind about:config setting, so need to use the Web Audio
      // API instead
      // && el.audioTracks.length !== 0
      && !el.defaultMuted;
    }).each((i, el) => {
      this.reportError($(el));
    });
    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = NavigationPlugin;

/***/ }),

/***/ "./plugins/shared/annotate/error-label.handlebars":
/*!********************************************************!*\
  !*** ./plugins/shared/annotate/error-label.handlebars ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"tota11y-label-help\">\n            (<a class=\"tota11y-label-link\" href=\"#\">?</a>)\n        </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function";

  return "<span class=\"tota11y-label-error-icon\">\n    <!--\n        \"Warning\" icon by Lorena Salagre\n        https://thenounproject.com/lorens/\n\n        Licensed under Creative Commons by 3.0 US\n        http://creativecommons.org/licenses/by/3.0/us/legalcode\n    -->\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" width=\"100%\" height=\"100%\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\n        <path d=\"M80.515,90.781H19.485c-6.145,0-10.779-2.168-13.052-6.103c-2.273-3.938-1.832-9.036,1.24-14.356l30.515-52.851  c3.07-5.321,7.266-8.251,11.811-8.251s8.741,2.93,11.811,8.251l30.515,52.851c3.072,5.32,3.513,10.418,1.24,14.356  C91.293,88.613,86.659,90.781,80.515,90.781z M50,12.384c-3.367,0-6.59,2.369-9.071,6.669L10.415,71.904  c-2.483,4.3-2.924,8.275-1.24,11.191c1.683,2.916,5.345,4.521,10.311,4.521h61.029c4.966,0,8.628-1.605,10.311-4.521  c1.683-2.916,1.243-6.89-1.24-11.191L59.071,19.053C56.59,14.753,53.367,12.384,50,12.384z M56.227,72.18  c0-3.172-2.572-5.744-5.744-5.744s-5.744,2.572-5.744,5.744c0,3.172,2.572,5.744,5.744,5.744S56.227,75.352,56.227,72.18z   M56.382,37.613c0-3.257-2.641-5.898-5.898-5.898c-3.257,0-5.898,2.641-5.898,5.898l1.393,20.932h0.019  c0.202,2.312,2.121,4.132,4.486,4.132c2.187,0,4.012-1.551,4.434-3.613c0.034-0.167,0.037-0.345,0.052-0.518h0.04L56.382,37.613z\"/>\n    </svg>\n</span>\n\n<span class=\"tota11y-label-content\">\n    <div class=\"tota11y-label-text\">"
    + ((stack1 = ((helper = (helper = helpers.text || (depth0 != null ? depth0.text : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"text","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "</div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.hasErrorEntry : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    <div class=\"tota11y-label-detail\">"
    + ((stack1 = ((helper = (helper = helpers.detail || (depth0 != null ? depth0.detail : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"detail","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "</div>\n</span>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/shared/annotate/index.js":
/*!******************************************!*\
  !*** ./plugins/shared/annotate/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Utility functions to annotate particular site elements.
 *
 * Annotations are namespaced, meaning you would normally include this
 * package like so:
 *
 *     let annotate = require("./annotate")("headers");
 *
 * This allows plugins to easily maintain their annotations, rather than
 * keeping track of an extra class name elsewhere.
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let errorLabelTemplate = __webpack_require__(/*! ./error-label.handlebars */ "./plugins/shared/annotate/error-label.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/shared/annotate/style.less"); // For very small (or zero-area) elements, highlights are not very useful.
// This constant declares highlights to be at least `MIN_HIGHLIGHT_SIZE` tall
// and across.


const MIN_HIGHLIGHT_SIZE = 25;
const isBrowser = typeof browser !== 'undefined'; // Polyfill fallback for IE < 10

window.requestAnimationFrame = window.requestAnimationFrame || function (callback) {
  window.setTimeout(callback, 16);
};

module.exports = namespace => {
  // The class that will be applied to any annotation generated in this
  // namespace
  const ANNOTATION_CLASS = "tota11y-annotation-" + namespace; // A queue of {$annotation, $parent}'s that is populated by
  // `createAnnotation` and emptied by the `render()` method.
  //
  // Annotations are queued to reduce reflows.

  let queue = []; // Register a new annotation to a given jQuery element

  let createAnnotation = ($el, className) => {
    // Create a position an annotation relative to its offset parent.
    // We also store the element its annotation so we can reposition when
    // the window resizes.
    let $annotation = $("<div>").addClass("tota11y") // tota11y base class for styling
    .addClass(ANNOTATION_CLASS).addClass(className).addClass("tota11y-annotation").css($el.position()).data({
      $el
    }); // TODO: We can invoke a requestAnimationFrame(render) here to limit
    // the amount of times we run that timer
    // Append an object to the queue. We'll add the annotation to the DOM
    // later to reduce reflows.

    queue.push({
      $annotation: $annotation,
      $parent: $el.offsetParent()
    });
    return $annotation;
  }; // To maintain a high framerate, we'll only render `RENDER_CHUNK_SIZE`
  // annotations per frame.
  //
  // NOTE: A value of "20" consistently hits 60fps on facebook.com


  const RENDER_CHUNK_SIZE = 20; // Mount all annotations to the DOM in sequence. This is done by
  // picking items off the queue, where each item consists of the
  // annotation and the node to which we'll append it.

  (function loop() {
    for (let i = 0; queue.length > 0 && i < RENDER_CHUNK_SIZE; i++) {
      let item = queue.shift();
      item.$parent.append(item.$annotation);
    }

    window.requestAnimationFrame(loop);
  })();

  let reposition = annotationClass => {
    let $annotations = $("." + annotationClass); // Record the position of each annotation's corresponding element to
    // batch measurements

    let positions = $annotations.map((i, el) => {
      return $(el).data("$el").position();
    }); // Reposition each annotation (batching invalidations)

    $annotations.each((i, el) => {
      $(el).css({
        top: positions[i].top,
        left: positions[i].left
      });
    });
  }; // Handle resizes by repositioning all annotations in bulk


  $(window).resize(() => reposition(ANNOTATION_CLASS));
  return {
    // Places a small label in the top left corner of a given jQuery
    // element. By default, this label contains the element's tagName.
    label($el, text = $el.prop("tagName").toLowerCase()) {
      let $label = createAnnotation($el, "tota11y-label");
      return $label.html(text);
    },

    // Places a special label on an element that, when hovered, displays
    // an expanded error message.
    //
    // This method also accepts an optional `errorEntry`, which
    // corresponds to the object returned from `InfoPanel.addError`. This
    // object will contain a "show()" method when the info panel is
    // rendered, allowing us to externally open the entry in the info
    // panel corresponding to this error.
    errorLabel($el, text, expanded, errorEntry) {
      let $innerHtml = $(errorLabelTemplate({
        text: text,
        detail: expanded,
        hasErrorEntry: !!errorEntry
      }));

      if (errorEntry) {
        $innerHtml.find(".tota11y-label-link").click(e => {
          e.preventDefault();
          e.stopPropagation();
          errorEntry.show();
        });

        if (isBrowser) {
          $innerHtml.hover(() => {
            errorEntry.highlightOn();
          }, () => {
            errorEntry.highlightOff();
          });
        }

        $innerHtml.hover(() => {
          errorEntry.$trigger.addClass("trigger-highlight");
        }, () => {
          errorEntry.$trigger.removeClass("trigger-highlight");
        });
      }

      return this.label($el).addClass("tota11y-label-error").html($innerHtml);
    },

    // Highlights a given jQuery element by placing a translucent
    // rectangle directly over it
    highlight($el) {
      let $highlight = createAnnotation($el, "tota11y-highlight");
      return $highlight.css({
        // include margins
        width: Math.max(MIN_HIGHLIGHT_SIZE, $el.outerWidth(true)),
        height: Math.max(MIN_HIGHLIGHT_SIZE, $el.outerHeight(true))
      });
    },

    // Toggles a highlight on a given jQuery element `$el` when `$trigger`
    // is hovered (mouseenter/mouseleave) or focused (focus/blur)
    toggleHighlight($el, $trigger) {
      let $highlight;
      $trigger.on("mouseenter focus", () => {
        if ($highlight) {
          $highlight.remove();
        }

        $highlight = this.highlight($el);
      });
      $trigger.on("mouseleave blur", () => {
        if ($highlight) {
          $highlight.remove();
          $highlight = null;
        }
      });
    },

    hide() {
      $(`.tota11y.tota11y-label.${ANNOTATION_CLASS}`).hide();
    },

    show() {
      $(`.tota11y.tota11y-label.${ANNOTATION_CLASS}`).show();
    },

    // Some plugins may alter the page and require us to reposition
    // all annotations from all plugins
    refreshAll() {
      reposition("tota11y-annotation");
    },

    removeAll() {
      // Remove all annotations
      $("." + ANNOTATION_CLASS).remove();
    }

  };
};

/***/ }),

/***/ "./plugins/shared/annotate/style.less":
/*!********************************************!*\
  !*** ./plugins/shared/annotate/style.less ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../../node_modules/css-loader!../../../node_modules/postcss-loader/src??postcss!../../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/shared/annotate/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/shared/audit.js":
/*!*********************************!*\
  !*** ./plugins/shared/audit.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Abstractions for how we use Accessibility Developer Tools
 */
function allRuleNames() {
  return axs.AuditRules.getRules().map(rule => rule.name);
} // Creates an audit configuration that whitelists a single rule and limits the
// amount of tests to run


function createWhitelist(ruleName) {
  var config = new axs.AuditConfiguration();
  config.showUnsupportedRulesWarning = false; // Ignore elements that are part of the toolbar

  config.ignoreSelectors(ruleName, ".tota11y *");
  allRuleNames().forEach(name => {
    if (name !== ruleName) {
      config.ignoreSelectors(name, "*");
    }
  });
  return config;
}
/*eslint-disable*/
// Patch collectMatchingElements to match
// https://github.com/GoogleChrome/accessibility-developer-tools/blob/0062f77258eb4eb8508dad3c92fd2df63c2381fc/src/js/AuditRule.js
//
// TODO: Remove once https://github.com/GoogleChrome/accessibility-developer-tools/commit/df400939addf6dbc5f2a9e1d52a6219f356f82d8
// makes its way to npm


function patchCollectMatchingElements() {
  /**
   * Recursively collect elements which match |matcher| into |collection|,
   * starting at |node|.
   * @param {Node} node
   * @param {function(Element): boolean} matcher
   * @param {Array.<Element>} collection
   * @param {ShadowRoot=} opt_shadowRoot The nearest ShadowRoot ancestor, if any.
   */
  axs.AuditRule.collectMatchingElements = function (node, matcher, collection, opt_shadowRoot) {
    if (node.nodeType === Node.ELEMENT_NODE) var element =
    /** @type {Element} */
    node;
    if (element && matcher.call(null, element)) collection.push(element); // Descend into node:
    // If it has a ShadowRoot, ignore all child elements - these will be picked
    // up by the <content> or <shadow> elements. Descend straight into the
    // ShadowRoot.

    if (element) {
      // NOTE: grunt qunit DOES NOT support Shadow DOM, so if changing this
      // code, be sure to run the tests in the browser before committing.
      var shadowRoot = element.shadowRoot || element.webkitShadowRoot;

      if (shadowRoot) {
        axs.AuditRule.collectMatchingElements(shadowRoot, matcher, collection, shadowRoot);
        return;
      }
    } // If it is a <content> element, descend into distributed elements - descend
    // into distributed elements - these are elements from outside the shadow
    // root which are rendered inside the shadow DOM.


    if (element && element.localName == 'content') {
      var content =
      /** @type {HTMLContentElement} */
      element;
      var distributedNodes = content.getDistributedNodes();

      for (var i = 0; i < distributedNodes.length; i++) {
        axs.AuditRule.collectMatchingElements(distributedNodes[i], matcher, collection, opt_shadowRoot);
      }

      return;
    } // If it is a <shadow> element, descend into the olderShadowRoot of the
    // current ShadowRoot.


    if (element && element.localName == 'shadow') {
      var shadow =
      /** @type {HTMLShadowElement} */
      element;

      if (!opt_shadowRoot) {
        console.warn('ShadowRoot not provided for', element);
      } else {
        var distributedNodes = shadow.getDistributedNodes();

        for (var i = 0; i < distributedNodes.length; i++) {
          axs.AuditRule.collectMatchingElements(distributedNodes[i], matcher, collection, opt_shadowRoot);
        }
      }
    } // If it is neither the parent of a ShadowRoot, a <content> element, nor
    // a <shadow> element recurse normally.


    var child = node.firstChild;

    while (child != null) {
      axs.AuditRule.collectMatchingElements(child, matcher, collection, opt_shadowRoot);
      child = child.nextSibling;
    }
  };
}
/*eslint-enable*/
// Audits for a single rule (by name) and returns the results for only that
// rule


function audit(ruleName) {
  let whitelist = createWhitelist(ruleName);
  patchCollectMatchingElements();
  return axs.Audit.run(whitelist).filter(result => result.rule.name === ruleName)[0];
}

module.exports = audit;

/***/ }),

/***/ "./plugins/shared/info-panel/controller.js":
/*!*************************************************!*\
  !*** ./plugins/shared/info-panel/controller.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/**
 * The following code defines the controller for an information panel
 * that can be invoked from any plugin to display summaries, errors,
 * or more information about what its plugin is doing.
 *
 * These panels are unique to the plugin that created them.
 *
 * Info panels consist of a title and three optional sections, which form
 * tabs that users can switch between.
 *
 *   Summary: A summary of the plugin's results
 *   Errors: A list of violations reported by this plugin. The tab marker also
 *           contains the number of errors listed
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");
/*
 * The info panel is depended on by every plugin and therefore cannot
 * require the plugins because it would introduce a circular dependency.
 *
 * Therefore we must depend on the plugins from a different file to
 * access this list on the Controller side, which is fine because all our
 * communication to the plugins on the page goes through the Port that the
 * InfoPanel creates.
 */


let plugins = __webpack_require__(/*! ../../../plugins */ "./plugins/index.js");

let infoPanel = __webpack_require__(/*! ./index.js */ "./plugins/shared/info-panel/index.js");

const debug = __webpack_require__(/*! ../../../utils/debugging.js */ "./utils/debugging.js");

let errorTemplate = __webpack_require__(/*! ./error.handlebars */ "./plugins/shared/info-panel/error.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/shared/info-panel/style.less");

const COLLAPSED_CLASS_NAME = "tota11y-collapsed";
const HIDDEN_CLASS_NAME = "tota11y-info-hidden";
const FIRST_ERROR_ID = 0;
const PORT_NAME = infoPanel.port;
const InfoPanel = infoPanel.panel;
const isBrowser = typeof browser !== 'undefined';
let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map(p => p.getName());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} // The background script maintains knowledge about the DevTools
// which we communicate with to trigger inspect element functionality
// for the InfoPanels Inspect Element button in the sidebar


let backgroundPort = browser.runtime.connect({
  name: "background"
}); // We also sync the status to the Inspect Element buttons

let devToolsIsActive = false;
backgroundPort.onMessage.addListener(json => {
  if (json.devToolsStatus) {
    devToolsIsActive = json.isActive;
    $(".tota11y-info-error-inspect-element").prop("disabled", !json.isActive);
  }
});
/*
 * The controller of all n info panels, delegating each
 * to an ActivePanel to mirror the InfoPanel instance on
 * the content script.
 */

class InfoPanelController {
  constructor() {
    this.activePanels = new Set();
    this.windowId = -1;

    if (isBrowser) {
      browser.runtime.onConnect.addListener(port => {
        if (port.name !== `${PORT_NAME}${this.windowId}`) {
          return;
        }

        this.port = port;
        port.onMessage.addListener(json => {
          if (json.msg) {
            debug.log(`InfoPanel controller received msg: ${json.msg}, ${json}`);
          }

          if (json.registerActive) {
            // retrieve the plugin instance from the name
            let index = namedPlugins.findIndex(p => p === json.plugin);

            if (index === -1) {
              port.postMessage("Unrecognised plugin");
              return;
            }

            let plugin = allPlugins[index]; // Destroy any existing active panel for the same plugin
            // to prevent double-renders

            [...this.activePanels].filter(ap => {
              return ap.plugin.getName() === plugin.getName();
            }).forEach(ap => {
              this.activePanels.delete(ap);
              ap.destroy();
            });
            this.activePanels.add(new ActivePanel(port, plugin));
          }

          if (json.elementMarked) {
            this.sendInspectElement(json.plugin);
          }
        });
        port.onDisconnect.addListener(port => {
          let activePanels = new Set();

          for (let ap of this.activePanels) {
            if (ap.port === port) {
              debug.log(`Discarding active panel ${ap.plugin.getName()}`); // discard the active panel with the port

              ap.destroy();
            } else {
              activePanels.add(ap);
            }
          }

          this.activePanels = activePanels;
        });
      });
    }
  }

  setWindowId(windowId) {
    this.windowId = windowId;
  }
  /*
   * Sends a message to the background port to attempt to inspect
   * the marked element on the page, then communicates with the
   * content script to remove the mark from the element on the page.
   */


  sendInspectElement(plugin) {
    let _this = this;

    backgroundPort.onMessage.addListener(function receiver(json) {
      if (json.msg) {
        debug.log(`Info panel controller received msg: ${json.msg}, ${json}`);
      }

      if (json.inspectedElement || json.failed) {
        backgroundPort.onMessage.removeListener(receiver); // Short delay for the element to actually be inspected
        // by the browser before we remove the class that marked it

        sleep(1000).then(() => {
          _this.port.postMessage({
            msg: "Unmark element for inspection",
            unmarkInspectedElement: true,
            plugin: plugin
          });
        });
      }
    });
    backgroundPort.postMessage({
      msg: "Inspect marked element",
      inspectMarkedElement: true
    });
  }

}
/*
 * A currentely active info panel in the side bar, with a 1 to 1
 * correspondence to active info panels running in the content script.
 */


class ActivePanel {
  constructor(port, plugin) {
    this.port = port;
    this.plugin = plugin;
    this.about = null;
    this.summary = null;
    this.errors = new Map();
    this.$el = null;
    port.onMessage.addListener(json => {
      if (json.msg) {
        debug.log(`ActivePanel received msg: ${json.msg}, ${json}`);
      }

      if (json.setAbout) {
        // convert HTML string back to jQuery HTML object
        this.about = $(json.setAbout);
      }

      if (json.setSummary) {
        // convert HTML string back to jQuery HTML object
        this.summary = $(json.setSummary);
      }

      if (json.addError) {
        let error = {
          title: json.title,
          // convert HTML strings back to jQuery HTML objects
          $description: $(json.description),
          // Hold reference to the HTML string because some
          // objects like <html> can't be recreated by jQuery
          // and we also do not want to execute arbitray code
          // defined on the web page by deserialising it
          //
          // The Navigation Plugin was tested on an auto playing
          // audio element in the page and reconstructing the
          // element here with jQuery caused the audio to auto
          // play from the sidebar, which the browser provides
          // no UI to mute!
          elHTMLString: json.el,
          id: json.id
        }; // We use the same ids as the InfoPanel in the content
        // script generates so we can map between our error
        // objects and the content script's error objects
        // by indexing the errors Map.

        this.errors.set(json.id, error);
      }

      if (json.render) {
        this.render();
      }

      if (json.directRender) {
        if (json.text) {
          this.$el.find(".tota11y-info-section.active").text(json.text);
        } else if (json.html) {
          this.$el.find(".tota11y-info-section.active").html($(json.html));
        }
      }

      if (json.showError) {
        if (json.plugin === this.plugin.getName()) {
          this.showError(json.errorId, true);
        }
      }

      if (json.highlightOn) {
        if (json.plugin === this.plugin.getName()) {
          this.doHighlightOn(json.errorId);
        }
      }

      if (json.highlightOff) {
        if (json.plugin === this.plugin.getName()) {
          this.doHighlightOff(json.errorId);
        }
      }
    });
  }
  /**
   * Positions the info panel in the sidebar.
   */


  initAndPosition() {
    // Append the info panel to the body.
    $("body").append(this.$el);
  }

  render() {
    // Destroy the existing info panel to prevent double-renders
    if (this.$el) {
      this.$el.remove();
    }

    let hasContent = false;
    this.$el = buildElement("div", {
      className: "tota11y tota11y-info tota11y-sidebar " + this.plugin.getName(),
      tabindex: "-1"
    }, buildElement("header", {
      className: "tota11y-info-title"
    }, this.plugin.getTitle(), buildElement("span", {
      className: "tota11y-info-controls"
    }, buildElement("label", {
      className: "tota11y-info-annotation-toggle"
    }, "Annotate:", " ", buildElement("input", {
      className: "toggle-annotation",
      type: "checkbox",
      checked: "checked"
    })))), buildElement("div", {
      className: "tota11y-info-body"
    }, buildElement("div", {
      className: "tota11y-info-sections"
    }), buildElement("ul", {
      role: "tablist",
      className: "tota11y-info-tabs"
    }))); // Add the appropriate tabs based on which information the info panel
    // was provided, then highlight the most important one.

    let $activeTab;

    if (this.about) {
      $activeTab = this._addTab("About", this.about); // Sync all checkbox states in the about tab to the content
      // script. We do this to make the layout plugin previews work from
      // the sidebar.

      let $checkboxes = this.about.find('input[type="checkbox"]');
      $checkboxes.each((index, el) => {
        $(el).click(e => {
          let checked = $(e.target).prop("checked");
          this.port.postMessage({
            msg: "Checkbox sync",
            checkboxSync: true,
            checked: !!checked,
            about: true,
            plugin: this.plugin.getName(),
            checkboxIndex: index
          });
        });
      });
    }

    if (this.summary) {
      $activeTab = this._addTab("Summary", this.summary);
    } // Wire annotation toggling to go through Port as the annotate
    // module is managed by the InfoPanel running in the content script.


    this.$el.find(".toggle-annotation").click(e => {
      if ($(e.target).prop("checked")) {
        this.port.postMessage({
          msg: "Show annotations",
          showAnnotations: true,
          plugin: this.plugin.getName()
        });
      } else {
        this.port.postMessage({
          msg: "Hide annotations",
          hideAnnotations: true,
          plugin: this.plugin.getName()
        });
      }
    }); // Wire click to expand text

    this.$el.find(".tota11y-click-to-expand").click(e => {
      e.preventDefault();
      e.stopPropagation();
      let $text = $(e.currentTarget);
      $text.toggleClass("tota11y-expanded");
      $text.attr("aria-expanded", $text.is(".tota11y-expanded"));
    });

    if (this.errors.size > 0) {
      let $errors = $("<ul>").addClass("tota11y-info-errors");
      this.errors.forEach((error, id) => {
        let $error = $(errorTemplate(error)); // Insert description jQuery object into template.
        // Description is passed as jQuery object
        // so that functionality can be inserted.

        $error.find(".tota11y-info-error-description").prepend(error.$description);
        $errors.append($error); // Wire up the expand/collapse trigger

        let $trigger = $error.find(".tota11y-info-error-trigger");
        let $desc = $error.find(".tota11y-info-error-description"); // Sync all checkbox states in the sidebar to the content
        // script. We do this to make the text contrast previw work from
        // the sidebar.

        let $checkboxes = $desc.find('input[type="checkbox"]');
        $checkboxes.each((index, el) => {
          $(el).click(e => {
            let checked = $(e.target).prop("checked");
            this.port.postMessage({
              msg: "Checkbox sync",
              checkboxSync: true,
              checked: !!checked,
              errorId: id,
              plugin: this.plugin.getName(),
              checkboxIndex: index
            });
          });
        });
        $trigger.click(e => {
          e.preventDefault();
          e.stopPropagation();
          $trigger.toggleClass(COLLAPSED_CLASS_NAME);
          $desc.toggleClass(COLLAPSED_CLASS_NAME);
        }); // Hold references to our $trigger and $desc for this error
        // to access externally when messaged to via the Port.
        // and to highlight the trigger when hovering over
        // inline error labels on the page.

        error.$trigger = $trigger;
        error.$desc = $desc; // Wire up the scroll-to-error button delegate

        let $scroll = $error.find(".tota11y-info-error-scroll");
        $scroll.click(e => {
          e.preventDefault();
          e.stopPropagation(); // The error annotation isn't on the sidebar page
          // so send the error id over the Port so we
          // can scroll to it from the content script

          this.port.postMessage({
            msg: "Scroll to error on page",
            scrollToError: true,
            errorId: id,
            plugin: this.plugin.getName()
          });
        });
        /*
         * Highlight the violating element on hover/focus. We do it
         * for both $trigger and $scroll to allow users to see the
         * highlight when scrolling to the element with the button.
         */

        $trigger.on("mouseenter focus", () => this.sendHighlightOn(id));
        $scroll.on("mouseenter focus", () => this.sendHighlightOn(id));
        $trigger.on("mouseleave blur", () => this.sendHighlightOff(id));
        $scroll.on("mouseleave blur", () => this.sendHighlightOff(id)); // Add code from error elemnt string to the information panel

        let errorHTML = error.elHTMLString; // Trim the code block if it is over 300 characters

        if (errorHTML.length > 300) {
          errorHTML = errorHTML.substring(0, 300) + "...";
        }

        let $relevantCode = $error.find(".tota11y-info-error-description-code-container code");
        $relevantCode.text(errorHTML); // Add a button to inspect the element

        let $inspectElement = $(`<button
                        class="tota11y-info-error-inspect-element"
                        title="Inspect Element with Developer Tools (F12) - must already be open to function"
                        aria-label="Inspect Element with Developer Tools (F12) - must already be open to function"
                     >
                        Inspect element
                    </button>`);
        $inspectElement.appendTo($error.find(".tota11y-info-error-description")); // Start the communications over the Port to
        // inspect the element from the devtools

        $inspectElement.click(() => {
          this.port.postMessage({
            msg: "Inspect element",
            inspectElement: true,
            errorId: id,
            plugin: this.plugin.getName()
          });
        });
        $inspectElement.prop("disabled", !devToolsIsActive);
      }); // Store a reference to the "Errors" tab so we can switch to it
      // later

      this.$errorsTab = $activeTab = this._addTab("Errors", $errors); // Add a small badge next to the tab title

      let $badge = $("<div>").addClass("tota11y-info-error-count").text(this.errors.size);
      $activeTab.find(".tota11y-info-tab-anchor").append($badge);
    }

    if ($activeTab) {
      $activeTab.trigger("activate"); // hasContent is technically coupled to $activeTab, since if there
      // is no $activeTab then there is no content. This behavior may
      // change in the future.

      hasContent = true;
    }

    if (hasContent) {
      this.initAndPosition();
    } // (a11y) Shift focus to the newly-opened info panel (unless configured
    // not to)


    browser.storage.local.get("focus-opened").then(storage => {
      if (storage["focus-opened"]) {
        this.$el.focus();
      }

      if (this.errors.size > 0) {
        // Jump to the first violation.
        this.showError(FIRST_ERROR_ID, !!storage["focus-opened"]);
      }
    });
    return this.$el;
  }
  /*
   * Maps an error id back to the error object held by this port
   * to display the error. We'll use this to access error entries
   * in this active panel from the content script's labels.
   *
   * Note that we are using our error object which we created
   * in the sidebar and not the same object the InfoPanel in
   * the content script created (but they will have the same ids).
   */


  showError(errorId, scrollTo) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    } // Make sure active panel is visible


    this.$el.removeClass(HIDDEN_CLASS_NAME); // Open the error entry

    error.$trigger.removeClass(COLLAPSED_CLASS_NAME);
    error.$desc.removeClass(COLLAPSED_CLASS_NAME); // Switch to the "Errors" tab

    this.$errorsTab.trigger("activate"); // Scroll to the error entry smoothly (unless configured not to)

    if (scrollTo) {
      $("html, body").animate({
        scrollTop: error.$trigger.offset().top - 10
      }, 50);
    }

    ;
  }
  /*
   * Sends the highlight on/off instructions over the Port
   * to allow the InfoPanel to apply the highlighting to its
   * annotations on the page.
   */


  sendHighlightOn(errorId) {
    // We provide no message as this will be sent very frequently
    this.port.postMessage({
      highlightOn: true,
      errorId: errorId,
      plugin: this.plugin.getName()
    });
  }

  sendHighlightOff(errorId) {
    // We provide no message as this will be sent very frequently
    this.port.postMessage({
      highlightOff: true,
      errorId: errorId,
      plugin: this.plugin.getName()
    });
  }
  /*
   * Applies highlighting to the error entry's trigger.
   */


  doHighlightOn(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    }

    error.$trigger.addClass("trigger-highlight");
  }

  doHighlightOff(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    }

    error.$trigger.removeClass("trigger-highlight");
  }

  destroy() {
    // Reset contents
    this.about = null;
    this.summary = null;
    this.errors = new Map(); // Remove the element

    if (this.$el) {
      this.$el.remove();
      this.$el = null;
    }

    this.port = null;
  }

} // copy tab method


ActivePanel.prototype._addTab = InfoPanel.prototype._addTab;
module.exports = InfoPanelController;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./plugins/shared/info-panel/error.handlebars":
/*!****************************************************!*\
  !*** ./plugins/shared/info-panel/error.handlebars ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper;

  return "<li class=\"tota11y-info-error\">\n    <a aria-label=\"Scroll to error\" href=\"#\" class=\"tota11y-info-error-scroll\">\n        <div class=\"tota11y-info-error-scroll-glyph tota11y-info-error-scroll-lens\"></div>\n        <div class=\"tota11y-info-error-scroll-glyph tota11y-info-error-scroll-handle\"></div>\n    </a>\n    <a href=\"#\" class=\"tota11y-info-error-trigger tota11y-collapsed\">\n        <div class=\"tota11y-info-error-title\">\n            <span class=\"tota11y-info-error-chevron\">\n                &#8250;\n            </span>\n            "
    + ((stack1 = ((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "\n        </div>\n    </a>\n    <div class=\"tota11y-info-error-description tota11y-collapsed\">\n        <div class=\"tota11y-info-error-description-code-container\">\n            <em>Relevant code:</em>\n            <code></code>\n        </div>\n    </div>\n</li>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/shared/info-panel/index.js":
/*!********************************************!*\
  !*** ./plugins/shared/info-panel/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/**
 * The following code defines an information panel that can be invoked from
 * any plugin to display summaries, errors, or more information about what
 * the plugin is doing.
 *
 * These panels are moveable and closeable, and are unique to the plugin that
 * created them. They appear in the bottom right corner of the viewport.
 *
 * Info panels consist of a title and three optional sections, which form
 * tabs that users can switch between.
 *
 *   Summary: A summary of the plugin's results
 *   Errors: A list of violations reported by this plugin. The tab marker also
 *           contains the number of errors listed
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let annotate = __webpack_require__(/*! ../annotate */ "./plugins/shared/annotate/index.js")("info-panel");

const debug = __webpack_require__(/*! ../../../utils/debugging.js */ "./utils/debugging.js");

let errorTemplate = __webpack_require__(/*! ./error.handlebars */ "./plugins/shared/info-panel/error.handlebars");

__webpack_require__(/*! ./style.less */ "./plugins/shared/info-panel/style.less");

const INITIAL_PANEL_MARGIN_PX = 10;
const COLLAPSED_CLASS_NAME = "tota11y-collapsed";
const HIDDEN_CLASS_NAME = "tota11y-info-hidden";
const PORT_NAME = "info-panel";
const FIRST_ERROR_ID = 0; // Automatically hide this InfoPanel if there is a browser
// object (running as a WebExtension) and this is toggled on
// We will want to toggle this auto hiding off for debugging.

const isBrowser = typeof browser !== 'undefined';
const WEBEXT_HIDE_IN_PAGE =  true && isBrowser;

class InfoPanel {
  constructor(plugin) {
    this.plugin = plugin;
    this.about = null;
    this.summary = null;
    this.error_ids = FIRST_ERROR_ID;
    this.errors = new Map();
    this.$el = null;
  }
  /**
   * Sets the contents of the about section as HTML
   */


  setAbout($html) {
    this.about = $html;

    if (isBrowser && this.port) {
      this.port.postMessage({
        msg: "about",
        setAbout: this.elToString($html)
      });
    }
  }
  /**
   * Sets the contents of the summary section as HTML
   */


  setSummary($html) {
    this.summary = $html;

    if (isBrowser && this.port) {
      this.port.postMessage({
        msg: "summary",
        setSummary: this.elToString($html)
      });
    }
  }
  /*
   * Directly renders HTML/text to the info panel,
   * replacing the active section.
   *
   * This is used for the screen reader tool where
   * we need to update the info panel cheaply and often
   * after initially rendering it rather than make
   * it display error information or a summary.
   */


  directRender($html) {
    if (typeof $html === "string") {
      this.$el.find(".tota11y-info-section.active").text($html);
    } else {
      this.$el.find(".tota11y-info-section.active").html($html);
    }

    if (isBrowser && this.port) {
      // We provide no message as this will be sent very frequently
      if (typeof $html === "string") {
        this.port.postMessage({
          directRender: true,
          text: $html
        });
      } else {
        this.port.postMessage({
          directRender: true,
          html: this.elToString($html)
        });
      }
    }
  }
  /**
   * Adds an error to the errors tab. Also receives a jQuery element to
   * highlight on hover.
   */


  addError(title, $description, $el) {
    let error = {
      title,
      $description,
      $el
    };
    let id = this.error_ids++;
    error.id = id;
    this.errors.set(id, error);

    if (isBrowser && this.port) {
      this.port.postMessage({
        msg: "error",
        addError: true,
        title: title,
        description: this.elToString($description),
        el: this.elToString($el),
        id: id
      });
    }

    return error;
  }

  _addTab(title, html) {
    // Create and append a tab marker
    let $tab = buildElement("li", {
      className: "tota11y-info-tab"
    }, buildElement("a", {
      className: "tota11y-info-tab-anchor",
      href: "#"
    }, buildElement("span", {
      className: "tota11y-info-tab-anchor-text"
    }, title)));
    this.$el.find(".tota11y-info-tabs").append($tab); // Create and append the tab content

    let $section = $("<div>").addClass("tota11y-info-section").html(html);
    this.$el.find(".tota11y-info-sections").append($section); // Register an "activate" event for the tab, which switches the
    // tab's associated content to be visible, and changes the
    // appearance of the newly-active tab marker

    $tab.on("activate", () => {
      this.$el.find(".tota11y-info-tab.active").removeClass("active");
      this.$el.find(".tota11y-info-section.active").removeClass("active");
      $tab.addClass("active");
      $section.addClass("active");
    }); // Activate the tab when its anchor is clicked

    $tab.on("click", e => {
      e.preventDefault();
      e.stopPropagation();
      $tab.trigger("activate");
    });
    return $tab;
  }
  /**
   * Positions the info panel and sets up event listeners to make the
   * panel draggable
   */


  initAndPosition() {
    let panelLeftPx, panelTopPx; // Wire up the dismiss button

    this.$el.find(".tota11y-info-dismiss-trigger").click(e => {
      e.preventDefault();
      e.stopPropagation();
      this.$el.addClass(HIDDEN_CLASS_NAME);

      if (!isBrowser) {
        // (a11y) Bring the focus back to the plugin's checkbox
        this.plugin.$checkbox.focus();
      }
    }); // Append the info panel to the body. In reality we'll likely want
    // it directly adjacent to the toolbar.

    $("body").append(this.$el); // Position info panel on the bottom right of the window

    panelLeftPx = window.innerWidth - this.$el.width() - INITIAL_PANEL_MARGIN_PX;
    panelTopPx = window.innerHeight - this.$el.height() - INITIAL_PANEL_MARGIN_PX; // Wire up draggable surface

    let $draggable = this.$el.find(".tota11y-info-title");
    let isDragging = false; // Variables for the starting positions of the mouse and panel

    let initMouseX, initMouseY;
    let initPanelLeft, initPanelTop;
    $draggable.on("mousedown", e => {
      e.preventDefault(); // Start dragging, and record initial mouse and panel
      // positions

      isDragging = true;
      initMouseX = e.pageX;
      initMouseY = e.pageY;
      initPanelLeft = panelLeftPx;
      initPanelTop = panelTopPx;
    }).on("mouseup", e => {
      e.preventDefault();
      isDragging = false;
    });
    $(window).on("mousemove", e => {
      if (!isDragging) {
        return;
      }

      e.preventDefault();
      let deltaX = e.pageX - initMouseX;
      let deltaY = e.pageY - initMouseY;
      panelLeftPx = initPanelLeft + deltaX;
      panelTopPx = initPanelTop + deltaY;
      this.$el.css({
        left: panelLeftPx,
        top: panelTopPx
      });
    });
    this.$el.css({
      left: panelLeftPx,
      top: panelTopPx
    });
  }

  render() {
    if (isBrowser && this.port) {
      this.port.postMessage({
        msg: "render",
        render: true
      });
    } // Destroy the existing info panel to prevent double-renders


    if (this.$el) {
      this.$el.remove();
    }

    let hasContent = false;
    this.$el = buildElement("div", {
      className: "tota11y tota11y-info " + this.plugin.getName(),
      tabindex: "-1"
    }, buildElement("header", {
      className: "tota11y-info-title"
    }, this.plugin.getTitle(), buildElement("span", {
      className: "tota11y-info-controls"
    }, buildElement("label", {
      className: "tota11y-info-annotation-toggle"
    }, "Annotate:", " ", buildElement("input", {
      className: "toggle-annotation",
      type: "checkbox",
      checked: "checked"
    })), buildElement("a", {
      "aria-label": "Close info panel",
      href: "#",
      className: "tota11y-info-dismiss-trigger"
    }, "\xD7"))), buildElement("div", {
      className: "tota11y-info-body"
    }, buildElement("div", {
      className: "tota11y-info-sections"
    }), buildElement("ul", {
      role: "tablist",
      className: "tota11y-info-tabs"
    }))); // Add the appropriate tabs based on which information the info panel
    // was provided, then highlight the most important one.

    let $activeTab;

    if (this.about) {
      $activeTab = this._addTab("About", this.about);
    }

    if (this.summary) {
      $activeTab = this._addTab("Summary", this.summary);
    } // Wire annotation toggling


    this.$el.find(".toggle-annotation").click(e => {
      // We must use the plugin's annotate instead of
      // the InfoPanel's as only the plugin's annotate
      // is namespaced for its annotations.
      if (this.plugin.getAnnotate()) {
        if ($(e.target).prop("checked")) {
          this.plugin.getAnnotate().show();
        } else {
          this.plugin.getAnnotate().hide();
        }
      }
    }); // Wire click to expand text

    this.$el.find(".tota11y-click-to-expand").click(e => {
      e.preventDefault();
      e.stopPropagation();
      let $text = $(e.currentTarget);
      $text.toggleClass("tota11y-expanded");
      $text.attr("aria-expanded", $text.is(".tota11y-expanded"));
    });

    if (this.errors.size > 0) {
      let $errors = $("<ul>").addClass("tota11y-info-errors"); // Store a reference to the "Errors" tab so we can switch to it
      // later

      let $errorsTab;
      this.errors.forEach((error, id) => {
        let $error = $(errorTemplate(error)); // Insert description jQuery object into template.
        // Description is passed as jQuery object
        // so that functionality can be inserted.

        $error.find(".tota11y-info-error-description").prepend(error.$description);
        $errors.append($error); // Wire up the expand/collapse trigger

        let $trigger = $error.find(".tota11y-info-error-trigger");
        let $desc = $error.find(".tota11y-info-error-description");
        $trigger.click(e => {
          e.preventDefault();
          e.stopPropagation();
          $trigger.toggleClass(COLLAPSED_CLASS_NAME);
          $desc.toggleClass(COLLAPSED_CLASS_NAME);
        }); // Attach a function to the original error object to open
        // this error so it can be done externally. We'll use this to
        // access error entries in the info panel from labels.

        error.show = () => {
          if (isBrowser && this.port) {
            // Send the message to the Sidebar panel
            // to open the error.
            this.port.postMessage({
              msg: "Show error",
              showError: true,
              plugin: this.plugin.getName(),
              errorId: id
            });
          }

          if (!WEBEXT_HIDE_IN_PAGE) {
            // Make sure info panel is visible
            this.$el.removeClass(HIDDEN_CLASS_NAME);
          } // Open the error entry


          $trigger.removeClass(COLLAPSED_CLASS_NAME);
          $desc.removeClass(COLLAPSED_CLASS_NAME); // Switch to the "Errors" tab

          $errorsTab.trigger("activate"); // Scroll to the error entry

          let $scrollParent = $trigger.parents(".tota11y-info-section");
          $scrollParent[0].scrollTop = $trigger[0].offsetTop - 10;
        }; // Attach the `$trigger` as well so can access it externally.
        // We use this to highlight the trigger when hovering over
        // inline error labels.


        error.$trigger = $trigger;

        if (isBrowser) {
          // Also attatch functions to trigger a highlight
          // in the sidebar which we can call externally.
          error.highlightOn = () => this.sendHighlightOn(id);

          error.highlightOff = () => this.sendHighlightOff(id); // And attatch the `$desc` so we can access this when
          // syncing checkboxes over the Port.


          error.$desc = $desc;
        } // Wire up the scroll-to-error button


        let $scroll = $error.find(".tota11y-info-error-scroll");
        $scroll.click(e => {
          e.preventDefault();
          e.stopPropagation(); // TODO: This attempts to scroll to fixed elements

          $(document).scrollTop(error.$el.offset().top - 80);
        }); // Expand the first violation

        if (id === FIRST_ERROR_ID) {
          $desc.toggleClass(COLLAPSED_CLASS_NAME);
          $trigger.toggleClass(COLLAPSED_CLASS_NAME);
        } // Highlight the violating element on hover/focus. We do it
        // for both $trigger and $scroll to allow users to see the
        // highlight when scrolling to the element with the button.


        annotate.toggleHighlight(error.$el, $trigger);
        annotate.toggleHighlight(error.$el, $scroll); // Add code from error.$el to the information panel

        let errorHTML = error.$el[0].outerHTML; // Trim the code block if it is over 300 characters

        if (errorHTML.length > 300) {
          errorHTML = errorHTML.substring(0, 300) + "...";
        }

        let $relevantCode = $error.find(".tota11y-info-error-description-code-container code");
        $relevantCode.text(errorHTML);
      });
      $errorsTab = $activeTab = this._addTab("Errors", $errors); // Add a small badge next to the tab title

      let $badge = $("<div>").addClass("tota11y-info-error-count").text(this.errors.size);
      $activeTab.find(".tota11y-info-tab-anchor").append($badge);
    }

    if ($activeTab) {
      $activeTab.trigger("activate"); // hasContent is technically coupled to $activeTab, since if there
      // is no $activeTab then there is no content. This behavior may
      // change in the future.

      hasContent = true;
    }

    if (hasContent) {
      this.initAndPosition();
    }

    if (WEBEXT_HIDE_IN_PAGE) {
      this.$el.addClass(HIDDEN_CLASS_NAME);
    } else {
      // (a11y) Shift focus to the newly-opened info panel
      this.$el.focus();
    }

    return this.$el;
  }

  destroy() {
    // Reset contents
    this.about = null;
    this.summary = null;
    this.error_ids = FIRST_ERROR_ID;
    this.errors = new Map(); // Remove the element

    if (this.$el) {
      this.$el.remove();
      this.$el = null;
    } // Remove the annotations


    annotate.removeAll(); // Remove inspection marks

    $(".tota11y-inspected-element").removeClass("tota11y-inspected-element");

    if (isBrowser && this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }
  /**
   * Opens a port to communicate to an InfoPanelController
   * over the browser.runtime API.
   */


  delegate(windowId) {
    if (isBrowser) {
      debug.log(`Opening info panel port ${this.plugin.getName()}`);
      let port = browser.runtime.connect({
        name: `${PORT_NAME}${windowId}`
      });
      this.port = port;
      port.postMessage({
        msg: `Opened port for window ${windowId}`,
        registerActive: true,
        plugin: this.plugin.getName()
      });
      port.onMessage.addListener(json => {
        if (json.msg) {
          debug.log(`InfoPanel received msg: ${json.msg}, ${json}`);
        } // Now handle plugin specific responses


        if (json.plugin !== this.plugin.getName()) {
          return;
        }

        if (json.scrollToError) {
          this.scrollToError(json.errorId);
        }

        if (json.highlightOn) {
          this.doHighlightOn(json.errorId);
        }

        if (json.highlightOff) {
          this.doHighlightOff(json.errorId);
        }

        if (json.showAnnotations) {
          if (this.plugin.getAnnotate()) {
            this.plugin.getAnnotate().show();
          }
        }

        if (json.hideAnnotations) {
          if (this.plugin.getAnnotate()) {
            this.plugin.getAnnotate().hide();
          }
        }

        if (json.checkboxSync) {
          this.doCheckboxSync(json.errorId, json.about, json.checkboxIndex, json.checked);
        }

        if (json.inspectElement) {
          this.markElementForInspection(json.errorId);
          this.port.postMessage({
            msg: "Marked element for inspection",
            elementMarked: true,
            plugin: this.plugin.getName()
          });
        }

        if (json.unmarkInspectedElement) {
          debug.log("Unmarked element for inspection");
          $(".tota11y-inspected-element").removeClass("tota11y-inspected-element");
        }
      });
    }
  }
  /*
   * Scrolls the page to an error annotation.
   */


  scrollToError(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    } // Scroll to the error annoatation on the page smoothly


    $("html, body").animate({
      scrollTop: error.$el.offset().top - 80
    }, 300);
  }
  /*
   * Sends the highlight on/off instructions over the Port
   * to allow the sidebar to highlight the trigger.
   */


  sendHighlightOn(errorId) {
    // We provide no message as this will be sent very frequently
    this.port.postMessage({
      highlightOn: true,
      errorId: errorId,
      plugin: this.plugin.getName()
    });
  }

  sendHighlightOff(errorId) {
    // We provide no message as this will be sent very frequently
    this.port.postMessage({
      highlightOff: true,
      errorId: errorId,
      plugin: this.plugin.getName()
    });
  }
  /*
   * Applies highlighting to the page's annotations
   */


  doHighlightOn(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    }

    if (error.$highlight) {
      error.$highlight.remove();
    }

    error.$highlight = annotate.highlight(error.$el);
  }
  /*
   * Removes highlighting from the page's annotations.
   */


  doHighlightOff(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    }

    if (error.$highlight) {
      error.$highlight.remove();
      error.$highlight = null;
    }
  }
  /*
   * Syncs the state of a checkbox in the InfoPanel
   * in the content script to the state of the checkbox in
   * the sidebar of the corresponding panel, error/about and checkbox.
   *
   * We use this to make the contrast and layout preview checkboxes work from
   * the sidebar.
   */


  doCheckboxSync(errorId, about, checkboxIndex, checked) {
    let $parent;

    if (about) {
      $parent = this.about;
    } else {
      let error = this.errors.get(errorId);

      if (error === undefined) {
        return;
      }

      $parent = error.$desc;
    }

    let $checkboxes = $parent.find('input[type="checkbox"]');
    let checkbox = $checkboxes.get(checkboxIndex);

    if (checkbox === undefined) {
      return;
    }

    let $checkbox = $(checkbox);

    if ($checkbox.prop("checked") !== checked) {
      // Sync the checkbox state
      $checkbox.click();
    }
  }

  markElementForInspection(errorId) {
    let error = this.errors.get(errorId);

    if (error === undefined) {
      return;
    }

    $(".tota11y-inspected-element").removeClass("tota11y-inspected-element");
    error.$el.addClass("tota11y-inspected-element");
  }

  elToString($el) {
    if (typeof $el === "string") {
      // already a string
      return $el;
    } // Convert jQuery HTML object to HTML string


    return $el.map(function () {
      // `this` refers to the DOM element when function()
      // is used but not => syntax
      return this.outerHTML;
    }) // retrieve the array
    .get() // convert into a single string
    .join("");
  }

}

module.exports = {
  panel: InfoPanel,
  port: PORT_NAME
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./plugins/shared/info-panel/style.less":
/*!**********************************************!*\
  !*** ./plugins/shared/info-panel/style.less ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../../../node_modules/css-loader!../../../node_modules/postcss-loader/src??postcss!../../../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/shared/info-panel/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../../../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/style.less":
/*!****************************!*\
  !*** ./plugins/style.less ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../node_modules/css-loader!../node_modules/postcss-loader/src??postcss!../node_modules/less-loader/dist/cjs.js!./style.less */ "./node_modules/css-loader/index.js!./node_modules/postcss-loader/src/index.js?!./node_modules/less-loader/dist/cjs.js!./plugins/style.less");
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(/*! ../node_modules/style-loader/addStyles.js */ "./node_modules/style-loader/addStyles.js")(content, {});
// Hot Module Replacement
if(false) {}

/***/ }),

/***/ "./plugins/tables/about.handlebars":
/*!*****************************************!*\
  !*** ./plugins/tables/about.handlebars ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tota11y-info-about-title\">\n    <a\n            href=\"https://www.w3.org/TR/WCAG21/#info-and-relationships\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        <span class=\"tota11y-info-about-title-link\">\n            WCAG &sect; 1.3.1 (Level A)\n        </span>\n    </a>\n</div>\n<p>\n    Tables can provide a lot of information and relationships from\n    correctly used markup that might otherwise only be available from visual\n    presentation.\n</p>\n<p>\n    This tool checks for a number of table markup errors and ommisions such as\n    providing headers for each cell which allows screen readers to vocalise the\n    headers of each cell as a user navigates through a table.\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        Understanding Info and Relationships\n    </a>\n</p>\n<p>\n    <a\n            href=\"https://www.w3.org/WAI/WCAG21/Techniques/html/H51\"\n            target=\"_blank\" class=\"tota11y-info-link\">\n        Using table markup to present tabular information\n    </a>\n</p>\n";
},"useData":true});

/***/ }),

/***/ "./plugins/tables/error-template.handlebars":
/*!**************************************************!*\
  !*** ./plugins/tables/error-template.handlebars ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "    <p>\n        You can give this table headings with <code>th</code> like so\n    </p>\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.tableBodys : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data})) != null ? stack1 : "")
    + "\n    <p>Headings should be on the entire first column, row, or both</p>\n\n    <p>\n        If the table is purely presentational (not tabulating data) you can mark it like so:\n        <pre><code>&lt;table role=\"presentation\"&gt;&lt;/table&gt;</code></pre>\n    </p>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "        <pre><code>&lt;table&gt;\n  &lt;thead&gt;\n    &lt;tr&gt;\n      &lt;th&gt;Header&lt;/th&gt;\n      &lt;th&gt;Header&lt;/th&gt;\n    &lt;tr/&gt;\n  &lt;/thead&gt;\n  &lt;tbody&gt;\n...\n</code></pre>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "\n    <pre><code>&lt;table&gt;\n  &lt;tr&gt;\n    &lt;th>Header&lt;/th&gt;\n    &lt;th>Header&lt;/th&gt;\n  &lt;/tr&gt;\n  &lt;tr&gt;\n    &lt;td>Cell&lt;/td&gt;\n    &lt;td>Cell&lt;/td&gt;\n...\n</code></pre>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "    <p>\n        The first table body looks like a table head.\n        You can mark it as a head as <code>&lt;thead&gt;</code> instead of <code>&lt;tbody&gt;</code>\n    </p>\n";
},"8":function(container,depth0,helpers,partials,data) {
    return "    <p>\n        Tables should have at most one &lt;thead&gt; This table has more than one.\n    </p>\n    <p>\n        You should move all the table rows (&lt;tr&gt;) into a single &lt;thead&gt; like so:\n    </p>\n\n    <pre><code>&lt;table&gt;\n  &lt;thead&gt;\n    &lt;tr&gt;\n      &lt;th&gt;First table header&lt;th/&gt;\n    &lt;tr/&gt;\n    &lt;tr&gt;\n      &lt;th&gt;Second table header&lt;th/&gt;\n...\n</code></pre>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.illegalCaption : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.illegalHeaders : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <p>\n        If the table is not for presentation only you can remove the presentation\n        role like so:\n        <pre><code>&lt;table&gt;<del>role=\"presentation\"</del>&lt;/table&gt;</code></pre>\n    </p>\n\n    <p>\n        Presentational tables are hidden from assistive technologies and\n        should only be marked as such when they are used for purposes other\n        than tabulating data such as controlling page layout.\n    </p>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            Presentational tables should not have a caption (<code>&lt;caption&gt;</code>)\n        </p>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "        <p>\n            Presentational tables should not have table headers (<code>&lt;th&gt;</code>) or heads (<code>&lt;thead&gt;</code>)\n        </p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.noHeadings : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.headInData : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.tooManyHeads : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.presentationError : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});

/***/ }),

/***/ "./plugins/tables/index.js":
/*!*********************************!*\
  !*** ./plugins/tables/index.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A plugin to identify malformed tables
 */
let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Plugin = __webpack_require__(/*! ../base */ "./plugins/base.js");

let annotate = __webpack_require__(/*! ../shared/annotate */ "./plugins/shared/annotate/index.js")("tables");

let audit = __webpack_require__(/*! ../shared/audit */ "./plugins/shared/audit.js");

let aboutTemplate = __webpack_require__(/*! ./about.handlebars */ "./plugins/tables/about.handlebars");

let errorTemplate = __webpack_require__(/*! ./error-template.handlebars */ "./plugins/tables/error-template.handlebars");

class TablesPlugin extends Plugin {
  getName() {
    return "tables";
  }

  getTitle() {
    return "Tables";
  }

  getDescription() {
    return "Identifies tables with markup problems";
  }

  getAnnotate() {
    return annotate;
  }

  errorMessage($el, presentationError, illegalHeaders, illegalCaption, noHeadings, tooManyHeads, headInData, dataInHead, data) {
    return errorTemplate({
      id: $el.attr("id"),
      presentationError: presentationError,
      illegalHeaders: illegalHeaders,
      illegalCaption: illegalCaption,
      noHeadings: noHeadings,
      tooManyHeads: tooManyHeads,
      headInData: headInData,
      dataInHead: dataInHead,
      data: data,
      tagName: $el.prop("tagName").toLowerCase()
    });
  }

  run() {
    let elements = $("table");

    let _this = this;

    if (elements.length > 0) {
      elements.each(function (index) {
        let $el = $(this);
        let data = {
          presentational: $el.attr("role") === "presentation",
          noHeadings: $el.find("th").length === 0,
          noCaptions: $el.find("caption").length === 0,
          heads: $el.find("thead").length,
          tableBodys: $el.children("tbody").length > 0,
          rootTableRows: $el.children("tr").length > 0
        };
        let illegalHeaders = data.presentational && !data.noHeadings;
        let illegalCaption = data.presentational && !data.noCaptions;
        let presentationError = illegalHeaders || illegalCaption;
        let noHeadings = !data.presentational && data.noHeadings;
        let tooManyHeads = data.heads > 1;
        let dataInHead = false;
        let headInData = false;
        let problems = 0;
        let title = "Table has problem(s) with its markup";

        if (tooManyHeads) {
          title = "Table has too many &lt;thead&gt;s";
          problems += 1;
        }

        if (illegalHeaders) {
          title = "Presentational table should not have headers";
          problems += 1;
        }

        if (illegalCaption) {
          title = "Presentational table should not have a caption";
          problems += 1;
        }

        if (noHeadings) {
          title = "Table is missing headers";
          problems += 1;
        } // Only scan into table markup for more complex
        // problems if there are not more simpler ones that
        // this might be confusing to see listed with.


        if (!noHeadings && !presentationError) {
          let $tableHead = $el.children("thead");

          if ($tableHead.length === 0) {
            let $rows;
            let $tableBody = $el.children("tbody");

            if ($tableBody.length === 0) {
              $rows = $el.children("tr");
            } else {
              $rows = $tableBody.children("tr");
            }

            let $firstRow = $rows.first();

            if ($tableBody.length > 0 && $firstRow.children("th").length > 0 && $firstRow.children("td").length === 0) {
              title = "First table body is a table head";
              headInData = true;
              problems += 1;
            }
          } else {
            if ($tableHead.children("td")) {
              title = "Table head contains data cells";
              dataInHead = true;
              problems += 1;
            }
          }
        }

        if (problems > 1) {
          title = "Table has problem(s) with its markup";
        }

        if (problems > 0) {
          // Place an error label on the element and register it as an
          // error in the info panel
          let entry = _this.error(title, $(_this.errorMessage($el, presentationError, illegalHeaders, illegalCaption, noHeadings, tooManyHeads, headInData, dataInHead, data)), $el);

          annotate.errorLabel($el, "", title, entry);
        }
      });
    }

    this.about($(aboutTemplate()));
  }

  cleanup() {
    annotate.removeAll();
  }

}

module.exports = TablesPlugin;

/***/ }),

/***/ "./settings/audit-dev-only/index.js":
/*!******************************************!*\
  !*** ./settings/audit-dev-only/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Setting = __webpack_require__(/*! ../base */ "./settings/base.js");
/*
 * The audit-dev-only is automatically synced with
 * the browser.storage.local area as the setting value
 * itself is what we check in the sidebar code.
 */


class AuditDevOnly extends Setting {
  getName() {
    return "audit-dev-only";
  }

  getDescription() {
    return "Audit localhost:// and file:// tabs only";
  }

  applyToSidebar() {
    return true;
  }

  applyToPage() {
    return false;
  }

  enable() {// TODO notify the sidebar code to insert tota11y if the
    // active tab was non localhost or file and we didn't insert
  }

  disable() {// TODO notify the sidebar code to remove tota11y if
    // the active tab is non localhost or file and we already inserted
  }

}

module.exports = AuditDevOnly;

/***/ }),

/***/ "./settings/base.js":
/*!**************************!*\
  !*** ./settings/base.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {/*
 * A setting that configures the behaviour of the addon or bookmarklet
 * in some way.
 * This module defines methods to render settings in a similar style to plugins
 * Each plugin will define five methods:
 *     getName: name to use for messaging to communicate to sidebar
 *     getDescription: description to display in the toolbar
 *     applyToSidebar: indicates this setting should be applied to the sidebar
 *     applyToPage: indicates this setting should be applied to the page
 *     enable: turns on this setting
 *     disable: turns off this setting
 */
class Setting {
  constructor() {
    this.$checkbox = null;
  }

  getName() {
    return getDescription().replace(" ", "-").toLowerCase();
  }

  getDescription() {
    return "";
  }

  applyToSidebar() {
    return false;
  }

  applyToPage() {
    return false;
  }

  render(clickHandler) {
    this.$checkbox = buildElement("input", {
      className: "tota11y-setting-checkbox tota11y-sr-only",
      type: "checkbox",
      onClick: () => clickHandler(this)
    });
    let $switch = buildElement("label", {
      className: "tota11y-setting-switch"
    }, this.$checkbox, buildElement("div", {
      "aria-hidden": "true",
      className: "tota11y-setting-indicator"
    }, "\u2713"), buildElement("div", {
      className: "tota11y-setting-info-setting"
    }, this.getDescription()));
    let $el = buildElement("li", {
      role: "menuitem",
      className: "tota11y-setting"
    }, $switch);
    return $el;
  }

  enable() {}

  disable() {}

  activate() {
    this.enable();
  }

  deactivate() {
    this.disable();
  }

  enabledByDefault() {
    return false;
  }

}

module.exports = Setting;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./settings/focus-opened/index.js":
/*!****************************************!*\
  !*** ./settings/focus-opened/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Setting = __webpack_require__(/*! ../base */ "./settings/base.js");
/*
 * The focus-opened is automatically synced with
 * the browser.storage.local area as the setting value
 * itself is what we check in the sidebar code.
 */


class FocusOpened extends Setting {
  getName() {
    return "focus-opened";
  }

  getDescription() {
    return "Shift focus to newly opened plugins";
  }

  applyToSidebar() {
    return true;
  }

  applyToPage() {
    return false;
  }

  enable() {}

  disable() {}

  enabledByDefault() {
    return true;
  }

}

module.exports = FocusOpened;

/***/ }),

/***/ "./settings/index.js":
/*!***************************!*\
  !*** ./settings/index.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * An index of settings.
 *
 * Exposes an array of setting instances.
 */
let TranslucentAnnotations = __webpack_require__(/*! ./translucent-annotations */ "./settings/translucent-annotations/index.js");

let AuditDevOnly = __webpack_require__(/*! ./audit-dev-only */ "./settings/audit-dev-only/index.js");

let FocusOpened = __webpack_require__(/*! ./focus-opened */ "./settings/focus-opened/index.js");

module.exports = [new TranslucentAnnotations(), new AuditDevOnly(), new FocusOpened()];

/***/ }),

/***/ "./settings/translucent-annotations/index.js":
/*!***************************************************!*\
  !*** ./settings/translucent-annotations/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let Setting = __webpack_require__(/*! ../base */ "./settings/base.js");

const STYLE_CLASS = "tota11y-setting-translucentAnnotations";

class TranslucentAnnotations extends Setting {
  getName() {
    return "translucent-annotations";
  }

  getDescription() {
    return "Translucent annotations";
  }

  applyToSidebar() {
    return false;
  }

  applyToPage() {
    return true;
  }

  enable() {
    this.$style = $(`<style class="${STYLE_CLASS}"
                    type="text/css">
                .tota11y-label {
                    opacity: 0.6;
                }
                .tota11y-label:hover {
                    opacity: 0.9;
                }
            </style>`);
    this.$style.appendTo($("head"));
  }

  disable() {
    $(`.${STYLE_CLASS}`).remove();
    this.$style = null;
  }

}

module.exports = TranslucentAnnotations;

/***/ }),

/***/ "./templates/logo.handlebars":
/*!***********************************!*\
  !*** ./templates/logo.handlebars ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Handlebars = __webpack_require__(/*! ../node_modules/handlebars/runtime.js */ "./node_modules/handlebars/runtime.js");
function __default(obj) { return obj && (obj.__esModule ? obj["default"] : obj); }
module.exports = (Handlebars["default"] || Handlebars).template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!--\n    \"Glasses\" icon by Kyle Scott\n    https://thenounproject.com/Kyle/\n\n    Licensed under Creative Commons by 3.0 US\n    http://creativecommons.org/licenses/by/3.0/us/legalcode\n-->\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Layer_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\n    <path fill=\"#ffffff\" d=\"M74.466,35.24c-1.069-0.19-2.208-0.267-3.228-0.562c-0.639-0.184-1.348-0.622-1.965-1.075  c-1.246-0.919-2.479-1.557-3.928-2.152c-0.671-0.276-1.617-0.698-2.432-0.608c-0.582,0.064-1.196,0.664-1.73,1.029  c-1.196,0.818-2.186,1.442-3.32,2.198c-0.524,0.35-1.308,0.798-1.543,1.263c-0.142,0.279-0.13,0.736-0.281,1.029  c-0.35,0.679-1.069,1.434-1.777,1.403c-0.835-0.038-1.773-1.518-1.449-2.619c0.177-0.602,1.126-0.902,1.776-1.262  c2.041-1.134,3.803-2.3,5.52-3.602c1.106-0.841,2.579-1.471,4.536-1.542c1.889-0.071,4.45-0.083,6.22,0  c1.465,0.066,2.698,0.164,3.976,0.42c7.308,1.469,14.698,2.788,21.607,4.77c0.739,0.213,2.896,0.613,3.086,1.311  c0.121,0.439-0.236,1.435-0.375,2.151c-0.165,0.865-0.292,1.626-0.42,2.246c-0.12,0.574-0.65,1.174-0.936,1.776  c-0.842,1.778-1.379,3.821-2.104,5.753c-0.954,2.545-2.02,4.859-3.554,6.968c-1.46,2.005-3.442,3.33-5.987,4.536  c-1.128,0.534-2.43,1.083-3.835,1.403c-1.355,0.311-3.263,0.63-4.817,0.28c-2.233-0.501-3.081-2.543-3.882-4.536  c-0.848-2.115-1.351-4.049-1.636-6.827c-2.692,0.176-3.259,2.014-4.163,3.928c-0.384,0.812-0.792,1.623-1.168,2.385  c-1.542,3.115-3.197,6.47-5.473,8.746c-1.215,1.213-2.581,2.03-4.35,2.758c-3.331,1.373-6.847,2.569-10.757,3.462  c-3.598,0.821-8.923,1.642-12.252-0.093c-2.136-1.113-3.105-3.939-4.023-6.268c-0.458-1.159-0.835-2.459-1.262-3.882  c-0.378-1.259-0.708-2.778-1.543-3.602c-1.053-1.037-2.78-1.414-3.227-2.993c-0.815-0.307-1.563-0.821-2.292-1.308  c-4.349-2.915-8.693-5.774-13.141-8.606c-0.727-0.462-1.667-0.958-2.151-1.497c-0.712-0.792-1.108-2.117-1.684-3.133  c-0.265-0.469-0.588-0.92-0.888-1.357c-0.275-0.4-0.536-0.997-1.076-1.076C2.223,36.823,2.365,37.469,2.349,38  c-0.017,0.549-0.077,1.172-0.047,1.823c0.028,0.606,0.297,1.049,0.28,1.544c-0.018,0.515-0.291,1.036-0.841,1.029  c-0.727-0.009-0.8-0.98-0.983-1.686c-0.209-0.807-0.483-1.551-0.421-2.245c0.049-0.531,0.341-1.223,0.468-2.057  c0.246-1.599,0.126-3.078,1.451-3.415C3.004,32.804,4,33.38,4.781,33.649c0.789,0.272,1.597,0.428,2.339,0.702  c0.854,0.316,1.706,0.875,2.524,1.355c2.526,1.484,4.626,3.112,7.062,4.63c3.273,2.041,6.545,3.955,9.307,6.267  c7.434-2.179,16.722-3.566,25.863-4.302c4.176-0.337,8.326-0.174,12.253,0.374c5.624,0.787,10.073-1.58,13.844-3.18  c2.035-0.864,4.078-1.653,6.173-2.573C80.804,36.331,77.705,35.814,74.466,35.24z M93.968,39.729  c-1.838-0.388-3.732-0.737-5.471-1.075c-0.059-0.012-0.127-0.067-0.188-0.046c-1.143,0.392-2.279,0.613-3.367,1.029  c-2.033,0.773-4.015,1.775-5.752,3.039C78.33,43.3,77.372,44,76.897,44.733c-1.609,2.489-1.206,7.214-0.467,10.149  c0.27,1.071,0.411,1.79,0.889,2.666c3.022,1.287,6.88-0.183,8.885-1.684c1.526-1.142,2.676-2.75,3.602-4.35  C91.815,48.042,93.102,43.946,93.968,39.729z M64.878,46.089c-6.121-1.937-14.865-0.822-21.232,0.467  c-4.477,0.907-9.474,1.92-10.944,5.753c-0.801,2.086-1.009,5.098-0.701,7.903c0.284,2.599,1.076,4.892,2.011,6.594  c2.943,2.698,10.038,1.581,14.124,0.375c2.523-0.745,4.112-1.389,5.845-2.197c1.973-0.921,4.636-1.939,5.285-4.116  c0.179-0.597,0.115-1.244,0.188-1.824c0.492-3.909,1.942-7.447,4.303-9.634c0.477-0.441,1.146-0.679,1.357-1.262  C65.37,47.428,65.13,46.709,64.878,46.089z\"/>\n</svg>\n";
},"useData":true});

/***/ }),

/***/ "./toolbar.js":
/*!********************!*\
  !*** ./toolbar.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(buildElement) {let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

let plugins = __webpack_require__(/*! ./plugins */ "./plugins/index.js");

let settings = __webpack_require__(/*! ./settings */ "./settings/index.js");

let logoTemplate = __webpack_require__(/*! ./templates/logo.handlebars */ "./templates/logo.handlebars");

const debug = __webpack_require__(/*! ./utils/debugging.js */ "./utils/debugging.js");

const PORT_NAME = "toolbar";
const INIT_PORT = "init";
let allPlugins = [...plugins.default, ...plugins.experimental];
let namedPlugins = allPlugins.map(p => p.getName());
let namedSettings = settings.map(p => p.getName());
const DISABLE_CSS = "tota11y-disabled-toolbar";
const isBrowser = typeof browser !== 'undefined';
/**
 * In a standalone script the toolbar is responsible for switching
 * active plugins and drawing its UI.
 * In a WebExtension the UI and the content script run in different
 * JS sandboxes with different priviledges. Therefore the toolbar becomes
 * responsible for everything but the UI, and the UI is synced to the rest of
 * the WebExtension over a Port to the ToolbarController.
 */

class Toolbar {
  constructor() {
    this.activePlugins = new Set();
    this.activeSettings = new Set();
    this.windowId = -1;
  }
  /**
   * Manages the state of the toolbar when a plugin is clicked, and toggles
   * the appropriate plugins on and off.
   */


  handlePluginClick(plugin) {
    // If the plugin was already selected, toggle it off
    if (this.activePlugins.has(plugin)) {
      plugin.deactivate();
      this.activePlugins.delete(plugin);
    } else {
      // Activate the selected plugin
      plugin.activate(this.windowId);
      this.activePlugins.add(plugin);
    }
  }
  /*
   * Manages the active setting strings in a similar way to plugins,
   */


  handleSettingClick(setting) {
    if (!setting.applyToPage()) {
      // skip
      return;
    }

    if (this.activeSettings.has(setting)) {
      setting.deactivate();
      this.activeSettings.delete(setting);
    } else {
      setting.activate();
      this.activeSettings.add(setting);
    }
  }
  /**
   * Renders the toolbar and appends it to the specified element.
   */


  appendTo($el) {
    let $logo = $(logoTemplate());
    let $toolbar;
    let $plugins = buildPlugins.bind(this)(false);

    let handleToggleClick = e => {
      e.preventDefault();
      e.stopPropagation();
      $toolbar.toggleClass("tota11y-expanded");
      $toolbar.attr("aria-expanded", $toolbar.is(".tota11y-expanded"));
    };

    let $toggle = buildElement("button", {
      "aria-controls": "tota11y-toolbar",
      className: "tota11y-toolbar-toggle",
      onClick: handleToggleClick,
      "aria-label": "[tota11y] Toggle menu"
    }, buildElement("div", {
      "aria-hidden": "true",
      className: "tota11y-toolbar-logo"
    }, $logo));
    $toolbar = buildElement("div", {
      id: "tota11y-toolbar",
      className: "tota11y tota11y-toolbar",
      role: "region",
      "aria-expanded": "false"
    }, buildElement("div", {
      className: "tota11y-toolbar-body"
    }, $plugins), $toggle);
    $el.append($toolbar);
    this.$el = $toolbar;

    if (isBrowser) {
      // Disable this toolbar as the sidebar will be controlling
      // the active plugins
      this.$el.addClass(DISABLE_CSS);
      this.$el.attr("role", "presentation");
      this.$el.removeAttr("aria-expanded");
      let $button = this.$el.find(".tota11y-toolbar-toggle");
      $button.prop("disabled", true);
      $button.removeAttr("aria-controls");
      $button.attr("aria-label", "[tota11y] Indicator");
      this.$el.find(".tota11y-toolbar-body").remove();
    }
  }
  /**
   * Opens a port to communicate to a ToolbarController
   * over the browser.runtime API.
   */


  delegate() {
    if (isBrowser) {
      // We need to establish what window we are in so
      // first listen to window id from the Port communication
      let getWindowId = port => {
        port.onMessage.addListener(json => {
          if (json.windowId) {
            this.windowId = json.windowId;

            this._delegate();

            port.disconnect();
          }
        });
        port.postMessage({
          msg: "Need window id for initialisation",
          getWindowId: true
        });
        browser.runtime.onConnect.removeListener(getWindowId);
      };

      browser.runtime.onConnect.addListener(getWindowId);
    }
  }
  /*
   * Performs the actual task of delegating to the ToolbarController
   * once we know what our window id is.
   */


  _delegate() {
    let port = browser.runtime.connect({
      name: `${PORT_NAME}${this.windowId}`
    });
    this.port = port;
    port.postMessage({
      msg: `Opened port for window ${this.windowId}`
    });
    port.onMessage.addListener(json => {
      debug.log(`Toolbar received msg: ${json.msg}, ${json}`);

      if (json.pluginClick) {
        // retrieve the plugin instance from the name
        let index = namedPlugins.findIndex(p => p === json.pluginClick);

        if (index !== -1) {
          let plugin = allPlugins[index];
          debug.log(`Plugin click sent through port ${plugin.getName()}`);
          let doToggle = this.activePlugins.has(plugin) !== json.active;

          if (doToggle) {
            // only toggle if not in sync with controller
            this.handlePluginClick(plugin);
          }
        } else {
          port.postMessage("Unrecognised plugin");
        }
      }

      if (json.settingClick) {
        // retrieve the setting instance from the name
        let index = namedSettings.findIndex(s => s === json.settingClick);

        if (index !== -1) {
          let setting = settings[index];
          debug.log(`Setting click sent through port ${setting.getName()}`);
          let doToggle = this.activeSettings.has(setting) !== json.active;

          if (doToggle) {
            // only toggle if not in sync with controller
            this.handleSettingClick(setting);
          }
        } else {
          port.postMessage("Unrecognised setting");
        }
      }

      if (json.sync) {
        debug.log("Syncing active plugins and settings");
        let activePlugins = new Set(json.activePlugins);

        for (let plugin of allPlugins) {
          let activate = activePlugins.has(plugin.getName());
          let active = this.activePlugins.has(plugin);

          if (activate !== active) {
            // only toggle if not in sync with controller
            this.handlePluginClick(plugin);
          }
        }

        let activeSettings = new Set(json.activeSettings);

        for (let setting of settings) {
          let activate = activeSettings.has(setting.getName());
          let active = this.activeSettings.has(setting);

          if (activate !== active) {
            // only toggle if not in sync with controller
            this.handleSettingClick(setting);
          }
        }
      }
    });
    port.onDisconnect.addListener(() => {
      // clean up
      for (let plugin of this.activePlugins) {
        // toggle all plugins off
        this.handlePluginClick(plugin);
      } // Remove this toobar element


      if (this.$el) {
        this.$el.remove();
        this.$el = null;
      }
    });
  }

}
/**
 * Responsible for the other side of the port to communicate to
 * a Toolbar over the browser.runtime API.
 */


class ToolbarController {
  constructor() {
    if (isBrowser) {
      this.activePlugins = new Set();
      this.activeSettings = new Set();
      this.windowId = -1;
      browser.runtime.onConnect.addListener(port => {
        if (port.name !== `${PORT_NAME}${this.windowId}`) {
          return;
        }

        if (this.port) {
          debug.log("Disconnecting old Port");
          this.port.disconnect();
        }

        this.port = port;
        this.port.onMessage.addListener(json => {
          debug.log(`Toolbar controller received msg: ${json.msg}, ${json}`);
        });
        this.syncActive();
      });
    }
  }

  syncActive() {
    if (!this.port) {
      return;
    }

    this.port.postMessage({
      msg: "Sync active plugins and settings",
      sync: true,
      activePlugins: [...this.activePlugins].map(p => p.getName()),
      // don't sync settings that don't do anything on the page
      activeSettings: [...this.activeSettings].filter(s => s.applyToPage()).map(s => s.getName())
    });
  }

  handlePluginClick(plugin) {
    if (this.activePlugins.has(plugin)) {
      this.activePlugins.delete(plugin);
    } else {
      this.activePlugins.add(plugin);
    }

    if (this.port) {
      this.port.postMessage({
        msg: "Plugin click",
        // Plugin instance will be different and not go
        // through JSON so pass the name instead.
        pluginClick: plugin.getName(),
        active: this.activePlugins.has(plugin)
      });
    }
  }

  handleSettingClick(setting) {
    if (this.activeSettings.has(setting)) {
      if (setting.applyToSidebar()) {
        setting.deactivate();
      } // save setting to local storage regardless of type


      browser.storage.local.set({
        [setting.getName()]: false
      });
      this.activeSettings.delete(setting);
    } else {
      if (setting.applyToSidebar()) {
        setting.activate();
      } // save setting to local storage regardless of type


      browser.storage.local.set({
        [setting.getName()]: true
      });
      this.activeSettings.add(setting);
    }

    if (!setting.applyToPage()) {
      // don't sync settings that don't do anything on the page
      return;
    }

    if (this.port) {
      this.port.postMessage({
        msg: "Setting click",
        // Settings are just identified by strings
        settingClick: setting.getName(),
        active: this.activeSettings.has(setting)
      });
    }
  }

  setWindowId(windowId) {
    this.windowId = windowId;
  }
  /**
   * Renders the toolbar and appends it to the specified element.
   */


  appendTo($el) {
    let $logo = $(logoTemplate());
    let $toolbar;
    let $plugins = buildPlugins.bind(this)(true);
    $toolbar = buildElement("div", {
      id: "tota11y-toolbar",
      className: "tota11y tota11y-toolbar tota11y-expanded tota11y-sidebar",
      role: "region",
      "aria-expanded": "true"
    }, buildElement("a", {
      href: "https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/",
      class: "tota11y-help",
      target: "_blank"
    }, "Help"), buildElement("div", {
      className: "tota11y-toolbar-body"
    }, $plugins)); // sync the state of the local storage for settings
    // to the sidebar UI

    settings.forEach(setting => {
      browser.storage.local.get(setting.getName()).then(storage => {
        let value = storage[setting.getName()];

        if (value) {
          setting.$checkbox.click();
        }

        if (typeof value === "undefined") {
          if (setting.enabledByDefault()) {
            // If we should be enabled by default and the setting
            // is not set on the browser then set it
            browser.storage.local.set({
              [setting.getName()]: true
            });
            setting.$checkbox.click();
          } // If the setting is not set on the browser but the plugin
          // is not enabled by default, we don't need to do anything
          // since the checkbox won't be ticked by default either

        }
      });
    });
    $el.append($toolbar);
  }

}
/*
 * Plugin DOM element building logic that is common to both the Toolbar
 * and the ToolbarController
 * `this` must be bound to the Toolbar or ToolbarController respectively
 */


function buildPlugins(isSidebar) {
  let $defaultPlugins = buildElement("li", null, buildElement("div", {
    className: "tota11y-plugins-separator"
  }, "Plugins"), buildElement("ul", null, plugins.default.map(Plugin => {
    // eslint-disable-line no-unused-vars
    return buildElement(Plugin, {
      onClick: this.handlePluginClick.bind(this)
    });
  })));
  let $experimentalPlugins = null;

  if (plugins.experimental.length) {
    $experimentalPlugins = buildElement("li", null, buildElement("div", {
      className: "tota11y-plugins-separator"
    }, "Experimental"), buildElement("ul", null, plugins.experimental.map(Plugin => {
      // eslint-disable-line no-unused-vars
      return buildElement(Plugin, {
        onClick: this.handlePluginClick.bind(this)
      });
    })));
  }

  let $settings = buildElement("li", null, buildElement("div", {
    className: "tota11y-plugins-separator"
  }, "Settings"), buildElement("ul", null, settings.filter(s => isSidebar ? true : s.applyToPage()).map(Setting => {
    // eslint-disable-line no-unused-vars
    return buildElement(Setting, {
      onClick: this.handleSettingClick.bind(this)
    });
  })));
  let $plugins = buildElement("ul", {
    className: "tota11y-plugins"
  }, $settings, $defaultPlugins, $experimentalPlugins);
  return $plugins;
}

module.exports = {
  toolbar: Toolbar,
  controller: ToolbarController
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./utils/element */ "./utils/element.js")))

/***/ }),

/***/ "./utils/debugging.js":
/*!****************************!*\
  !*** ./utils/debugging.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

const DEBUGGING = false;
/*
 * A console logging wrapper that can be turned on and off easily.
 *
 * Note: files not built by Webpack can't access this flag and need
 * to be configured seperately. This affects the devtools and background
 * javascripts.
 */

if (DEBUGGING) {
  module.exports = {
    log: message => console.log(message),
    error: message => console.error(message)
  };
} else {
  module.exports = {
    log: message => null,
    error: message => null
  };
}

/***/ }),

/***/ "./utils/element.js":
/*!**************************!*\
  !*** ./utils/element.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A function used by Babel to transpile JSX code into jQuery elements
 */
function buildElement(type, props, ...children) {
  // We need to require jQuery inside of this method because `require()`
  // will work different after mocha's magic "before" method runs.
  //
  // This allows us to use the jQuery instance provided by our jsdom
  // instance.
  let $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js"); // Is our element a TextNode?


  if (props === undefined) {
    // Type will be the text content, which can simply be returned here
    return type; // Is our element a Plugin?
  } else if (type.render) {
    // Render the plugin with the passed-in click handler
    return type.render(props && props.onClick); // Otherwise, build the element with jQuery
  } else {
    let $el = $("<" + type + ">"); // Iterate through props

    if (props !== null) {
      for (let propName in props) {
        // onClick gets turned into a jQuery event handler
        // TODO: Handle props like onHover, onFocus, etc.
        if (propName === "onClick") {
          let handler = props[propName];
          $el.click(handler); // Some passed-in props need to be set with $.attr
          // Currently we do this for role and aria-*
        } else if (/^aria-/.test(propName) || propName === "role") {
          let value = props[propName];
          $el.attr(propName, value); // All other props can go right to $.prop
        } else {
          let value = props[propName];
          $el.prop(propName, value);
        }
      }
    } // Recurse through the children and append each resulting element to
    // the parent


    children.forEach(child => {
      $el.append(buildElement(child));
    });
    return $el;
  }
}

module.exports = buildElement;

/***/ })

/******/ });