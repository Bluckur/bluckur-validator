const level = require('level');

const verbose = true;

const databasePath = '../database';


let db;

class Database {
  constructor() {
    this.open();
  }

  open() {
    this.db = level(databasePath, { createIfMissing: true }, (err, db) => {
      if (err && verbose) console.log(err);
    });
  }

  close() {
    this.db.close((err) => {
      if (err && verbose) console.log(err);
    });
  }

  /**
     *
     * @param {*} key
     * @param {*} value
     */
  put(key, value) {
    return new Promise((resolve) => {
      this.db.put(key, value, (err) => {
        if (err && verbose) console.log(`Unable to put ${value}into the database.`, err); // some kind of I/O error
        resolve(true);
      })
    });
  }

  /**
     * returns a promise
     * @param {*} key
     * @return {*} value
     */
  get(key) {
    return new Promise((resolve) => {
      this.db.get(key, (err, value) => {
        if (err && verbose) return console.log(`${key} has no matches`);
        if (value) resolve(value);
      });
    });
  }

  /**
     *
     * @param {*} key
     */
  delete(key) {
    return new Promise((resolve) => {
      this.db.del(key, (err) => {
        if (err && verbose) console.log(err);
      })
        .then(() => { resolve(true); });
    });
  }

  /**
   *
   * @param {any} key
   * @param {any} value
   * @returns
   * @memberof Database
   */
  update(key, value) {
    return new Promise((resolve) => {
      this.db.batch()
        .del(key)
        .put(key, value)
        .write(() => { resolve(true); });
    });
  }
}

module.exports = Database;
