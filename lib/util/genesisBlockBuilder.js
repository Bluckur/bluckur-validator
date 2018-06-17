const Models = require('bluckur-models');
const TransactionSecurity = require('./../security/transactionSecurity').getInstance();
const BlockSecurity = require('./../security/blockSecurity').getInstance();

// Singleton support
let instance = null;

class GenesisBlockBuilder {
  buildAsync() {
    return new Promise((resolve, reject) => {
      const genenisBlock = {};
      const transactions = this.createTransactions();
      this.signTransactionsAsync(transactions).then((signedTransactions) => {
        genenisBlock.transactions = signedTransactions;
        genenisBlock.blockHeader = this.createBlockHeader();
        return BlockSecurity.getHashAsync(genenisBlock);
      }).then((hash) => {
        genenisBlock.blockHeader.blockHash = hash;
        this.addBlockHashToTransactions(hash, genenisBlock.transactions);
        resolve(genenisBlock);
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
        const adminKey = process.env.PUBKEY_ADMIN;
        promises.push(TransactionSecurity.signAsync(transaction, adminKey + adminKey));
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
      instance = new GenesisBlockBuilder();
    }
    return instance;
  },
};
