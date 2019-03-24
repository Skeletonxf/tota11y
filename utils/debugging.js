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
        log: (message) => console.log(message),
        error: (message) => console.error(message),
    }
} else {
    module.exports = {
        log: (message) => null,
        error: (message) => null,
    }
}
