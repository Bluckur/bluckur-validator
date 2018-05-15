const level = require('level');

const verbose = true;

const databasePath = '../database';


let db;

class Database {
  constructor() {
    open();
  }

  static open() {
    this.db = level(databasePath, { createIfMissing: false }, (err, db) => {
      if (err && verbose) console.log(err);
    });
  }

  static close() {
    this.db.close((err) => {
      if (err && verbose) console.log(err);
    });
  }

  /**
     *
     * @param {*} key
     * @param {*} value
     */
  static put(key, value) {
    db.put(key, value, (err) => {
      if (err && verbose) console.log(`Unable to put ${value}into the database.`, err); // some kind of I/O error
    });
  }

  /**
     * returns a promise
     * @param {*} key
     * @return {*} value
     */
  static get(key) {
    return new Promise((resolve, reject) => {
      db.get(key, (err, value) => {
        if (err && verbose) return console.log(`${key} has no matches`);
        if (value) resolve(value);
      });
    });
  }

  /**
     *
     * @param {*} key
     */
  static delete(key) {
    db.del(key, (err) => {
      if (err && verbose) console.log(err);
    });
  }

  /**
     *
     * @param {*} ops {type: 'put/del', key:'key', value:'value'}
     */
  static batch(ops) {
    db.batch(ops, (err) => {
      if (err && verbose) console.log(err);
    });
  }
}


// 3) Fetch by key
