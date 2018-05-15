let level = require('level');
const verbose = true;

const databasePath = '../database';


let db;

class Database {
    constructor() {
        this.open();
    }

    open() {
        this.db = level(databasePath, {createIfMissing: false}, function (err, db) {
            if (err && verbose) console.log(err);
        });
    }

    close() {
        this.db.close(function (err) {
            if (err && verbose) console.log(err);
        });
    }

    /**
     *
     * @param {*} key
     * @param {*} value
     */
    put(key, value) {
        this.db.put(key, value, function (err) {
            if (err && verbose) console.log('Unable to put ' + value + 'into the database.', err); // some kind of I/O error
        });
    }

    /**
     * returns a promise
     * @param {*} key
     * @return {*} value
     */
    get(key) {
        return new Promise((resolve, reject) => {
            this.db.get(key, function (err, value) {
                if (err && verbose) return console.log(key + ' has no matches');
                if (value) resolve(value);
            });
        });


    }

    /**
     *
     * @param {*} key
     */
    delete(key) {
        this.db.del(key, function (err) {
            if (err && verbose) console.log(err);
        });
    }

    /**
     *
     * @param {*} ops {type: 'put/del', key:'key', value:'value'}
     */
    batch(ops) {
        this.db.batch(ops, function (err) {
            if (err && verbose) console.log(err);
        });
    }
}

module.exports = Database;