const Security = require('./security').getInstance();

// Singleton support
let instance = null;

class TransactionSecurity {
    constructor(security) {
        this.security = security;
    }

    signAsync(transaction, privateKey) {
        return new Promise((resolve, reject) => {
            const { signature, blockHash, ...other } = transaction;
            Security.signAsync(other, privateKey).then((detachedSignature) => {
                transaction.signature = detachedSignature; // eslint-disable-line no-param-reassign
                resolve(transaction);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    verifySignatureAsync(transaction) {
        return new Promise((resolve, reject) => {
            const { signature, blockHash, ...other } = transaction;
            Security.verifyAsync(signature, other.sender).then((isValid) => {
                resolve(isValid);
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = {
    getInstance() {
        if (!instance) {
            instance = new TransactionSecurity();
        }
        return instance;
    },
};