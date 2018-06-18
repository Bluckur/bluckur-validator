const Models = require('bluckur-models');
const TransactionSecurity = require('./../security/transactionSecurity').getInstance();
const KeyStorage = require('./keyStorage');

// Singleton support
let instance = null;

class TransactionBuilder {
    buildAsync(publickeyrecipient, amount) {
        return new Promise((resolve, reject) => {
            new KeyStorage().getKeypairAsync().then(({ privKey, pubKey }) => {
                const transaction = Models.createTransactionInstance({
                    recipient: publickeyrecipient,
                    amount,
                    timestamp: +new Date(),
                    type: 'coin',
                    sender: pubKey,
                });
                return TransactionSecurity.signAsync(transaction, privKey);
            }).then((signedtrans) => {
                resolve(signedtrans);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    signTransactionsAsync(transactions) {
        return new Promise((resolve, reject) => {
            const promises = [];
            transactions.forEach((transaction) => {
                promises.push(TransactionSecurity.signAsync(transaction, process.env.PRIVKEY_ADMIN));
            });
            Promise.all(promises).then((signedTransactions) => {
                resolve(signedTransactions);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    addBlockHashToTransactions(blockHash, transactions) {
        transactions.forEach((transaction) => {
            transaction.blockHash = blockHash; // eslint-disable-line no-param-reassign
        });
    }
}

module.exports = {
    getInstance() {
        if (!instance) {
            instance = new TransactionBuilder();
        }
        return instance;
    },
};