/*
 * The script responsible for creating the dev tools panel.
 *
 * This panel is not supposed to be interacted with, as we only need
 * it to access `browser.devtools` so we can inspect elements on the page
 * but unfortunately there is not a method to delete panels so we cannot
 * create the panel only when needed and delete it afterwards.
 */

browser.devtools.panels.create(
    "Tota11y prototype",
    "", // TODO Icon
    "/devtools/panel/index.html",
).then((panel) => {
    panel.onShown.addListener(() => console.log("Panel shown"));
    panel.onHidden.addListener(() => console.log("Panel hidden"));
});
