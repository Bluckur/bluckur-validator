const Security = require('../logic/security');

/**
 *
 */
class Transaction {
    /**
     *
     * @param {*} data
     */
    constructor(data) {
        this.senderpubkey = data.senderpubkey;
        this.receiveraddress = data.receiveraddress;
        this.amount = data.amount;
        this.timestamp = data.timestamp;
        // TODO add nonce integer increasing by 1 for each added Transaction.

        this.data = data;
        this.signature = data.signature;
    }

    /**
     * @return {*}
     */
    getTimeStamp() {
        return this.timestamp;
    }

    /**
     * @return {*}
     */
    verifySignature() {
        return new Promise((resolve, reject) => {
            Security.verifyDetached(this.data, this.signature, this.senderpubkey).then((isValid) => {
                resolve(isValid);
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = Transaction;
