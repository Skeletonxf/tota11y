const DEBUGGING = true;

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
