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
