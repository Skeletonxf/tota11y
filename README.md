# Totally Automated Accessibility Scanner

Totally Automated Accessibility Scanner, or Totally for short (a play on this project's origin tota11y), is an automated accessiblity auditing tool that runs in your browser and is designed to help you identify a number of accessibility concerns relating to the comprehensive guidelines maintained by the WC3 in the [WCAG](https://www.w3.org/TR/WCAG21/) without prior accessibility knowledge to make sense of the results.

[The help page](https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/)

[Install for Mozilla Firefox](https://addons.mozilla.org/en-GB/firefox/addon/totally-automated-a11y-scanner/)

Totally was built as part of a 3rd year Computer Science Dissertation project on Web Accessibility testing.

## Installation

Totally is a [WebExtension for Mozilla Firefox](https://addons.mozilla.org/en-GB/firefox/addon/totally-automated-a11y-scanner/) built from the [bookmarklet tota11y created by Khan Academy](https://github.com/Khan/tota11y).
Due to keeping plugin compatibility Totally should also still function as a bookmarklet in the same way as the original, but this is not the intended use.

## Development

Installation steps

```bash
git clone https://gitlab.com/skeletonxf/totally-automated-a11y-scanner
cd totally-automated-a11y-scanner/
npm install
npm run dev
# Go to about:debugging in Firefox
# load addon/manifest.json
```

All node package dependencies are for build time only. As the builds are committed to enable bookmarklets you only need to run npm if you start editing the code.

## Original notes

The following sections are derived from tota11y's help page.

### Architecture Overview

Most of the functionality in tota11y comes from its **plugins**. Each plugin
gets its own directory in [`plugins/`](https://github.com/Khan/tota11y/tree/master/plugins) and maintains its own JavaScript, CSS,
and even handlebars. [Here's what the simple LandmarksPlugin looks like](https://github.com/Khan/tota11y/blob/master/plugins/landmarks/index.js).

[`plugins/shared/`](https://github.com/Khan/tota11y/tree/master/plugins/shared) contains a variety of shared utilities for the plugins, namely the [info-panel](https://github.com/Khan/tota11y/tree/master/plugins/shared/info-panel) and [annotate](https://github.com/Khan/tota11y/tree/master/plugins/shared/annotate) modules, which are used to report accessibility violations on the screen.

[`index.js`](https://github.com/Khan/tota11y/blob/master/index.js) brings it all together.

tota11y uses a variety of technologies, including [jQuery](https://jquery.com/), [webpack](https://webpack.github.io/), [babel](https://babeljs.io/), and [JSX](https://facebook.github.io/jsx/). **There's no need to know all (or any!) of these to contribute to tota11y, but we hope tota11y is a good place to learn something new and interesting.**

*****

Totally adds:

`settings/` for settings in a very similar style to plugins.  
`addon/` for the WebExtension code.  
`public/` for the publicly available [help page]((https://skeletonxf.gitlab.io/totally-automated-a11y-scanner/)) on Gitlab Pages.  
`toolbar.js` for enabling the plugins from the sidebar of the browser  
`plugins/shared/info-panel/controller.js` for interacting with plugins from the sidebar.  
and many more plugins testing accessibility criteria.

Further elaboration on the addon architecture is in ARCHITECTURE.md.

### Testing

You can run unit tests on totally (as a bookmarklet) with the following:

```bash
npm test
```

Or lint the source code with:

```bash
npm run lint
```

FIXME live testing the bookmarklet

## Special thanks

Many plugins and much code in general comes from [tota11y by Khan Academy](https://khan.github.io/tota11y/). In turn many of those features come from [Google Chrome's Accessibility Developer Tools](https://github.com/GoogleChrome/accessibility-developer-tools). You will still see tota11y mentioned all over this project if you inspect the CSS names and the code.

## License

[MIT License](LICENSE.txt)

Google Chrome Accessibility Developer Tools is licensed under the Apache License 2.0 and other libraries like jQuery are similarly licensed under permissive licenses.
