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

    createTransactions() {
        return [
            Models.createTransactionInstance({
                recipient: process.env.PUBKEY_ADMIN,
                amount: 10,
                timestamp: +new Date(),
                type: 'coin',
                sender: '00000',
            }),
            Models.createTransactionInstance({
                recipient: process.env.PUBKEY_ADMIN,
                amount: 10,
                timestamp: +new Date(),
                type: 'stake',
                sender: '00000',
            }),
        ];
    }

    createBlockHeader() {
        return Models.createBlockHeaderInstance({
            blockNumber: 0,
            validator: process.env.PUBKEY_ADMIN,
            timestamp: +new Date(),
            blockReward: this.BLOCK_REWARD,
            parentHash: '00000',
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