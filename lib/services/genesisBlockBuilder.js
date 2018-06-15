const Models = require('bluckur-models');
const TransactionSecurity = require('./../security/transactionSecurity').getInstance();
const BlockSecurity = require('./../security/blockSecurity').getInstane();

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
        this.addBlockHashToTransactions(hash);
        resolve(genenisBlock);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  createTransactions() {
    return [
      Models.createTransactionInstance({
        recipient: process.env.PUBLICKEY_ADMIN,
        amount: 69,
        timestamp: +new Date(),
        type: 'coin',
      }),
      Models.createTransactionInstance({
        recipient: process.env.PUBLICKEY_ADMIN,
        amount: 1,
        timestamp: +new Date(),
        type: 'stake',
      }),
    ];
  }

  createBlockHeader() {
    return Models.createBlockHeaderInstance({
      blockNumber: 0,
      validator: process.env.PUBLICKEY_ADMIN,
      timestamp: +new Date(),
      blockReward: this.BLOCK_REWARD,
      parentHash: '0',
    });
  }

  signTransactionsAsync(transactions) {
    return new Promise((resolve, reject) => {
      const promises = [];
      transactions.forEach((transaction) => {
        promises.push(TransactionSecurity.signAsync(transaction, process.env.PUBLICKEY_ADMIN));
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
