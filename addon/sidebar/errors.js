/*
 * Generates a function which logs an error with
 * a custom message, then propagates the error
 *
 * The message should be unique so the line that
 * caused it can be identified.
 */
function propagateError(msg) {
    return (error) => {
        console.error(`Error: ${error}, at: ${msg}`);
        throw error;
    };
}

module.exports = {
    propagateError: propagateError,
};
