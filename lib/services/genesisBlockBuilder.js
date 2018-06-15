const Models = require('bluckur-models');

class GenesisBlockBuilder {
  constructor(blockSecurity, transactionSecurity) {
    this.blockSecurity = blockSecurity;
    this.transactionSecurity = transactionSecurity;
  }

  buildAsync() {
    return new Promise((resolve, reject) => {
      const genenisBlock = {};
      const transactions = this.createTransactions();
      this.signTransactionsAsync(transactions).then((signedTransactions) => {
        genenisBlock.transactions = signedTransactions;
        genenisBlock.blockHeader = this.createBlockHeader();
        return this.blockSecurity.getHashAsync(genenisBlock);
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
        promises.push(this.transactionSecurity.signAsync(transaction, process.env.PUBLICKEY_ADMIN));
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
  createInstance(blockSecurity, transactionSecurity) {
    if (!blockSecurity || !transactionSecurity) {
      throw new Error('Invalid argument(s)');
    }
    return new GenesisBlockBuilder(blockSecurity, transactionSecurity);
  },
};
