const fs = require('fs');
const Security = require('../security/security');
const Peer = require('../p2p/peer');

class KeyStorage {
    constructor() {
        this.security = Security.getInstance();
    }

    checkFileExists() {
        return new Promise((resolve, reject) => {
            fs.access(".keys", fs.constants.F_OK, (err) => {
                if (err) {
                    reject(Error(err));
                }
                else {
                    resolve();
                }
            });
        });
    }

    checkOrGenerateKeypair() {
        return new Promise((resolve, reject) => {
            this.checkFileExists().then(() => {
                resolve();
            }, () => {
                    this.security.generateKeyPair(this.security.generateMnemonic()).then((result) => {
                        fs.appendFile('.keys', JSON.stringify(result), function (err) {
                            if (err) {
                                reject(Error(err));
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                })
        })
    }

    getKeypairAsync() {
        return new Promise((resolve, reject) => {
            this.checkOrGenerateKeypair().then(() => {
                fs.readFile(".keys", "utf8", function (err, data) {
                    if (err) reject(err);
                    resolve(JSON.parse(data));
                });
            }, (err) => {
                    reject(err);
                });
        });

    }
}

module.exports = KeyStorage;
