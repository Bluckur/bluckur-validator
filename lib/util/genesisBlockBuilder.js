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
        // TODO: Check if needed to be hard coded
        const privKey = '08090009000000000000000000010008090703000000000300050000000200005f41601a755d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb';
        promises.push(TransactionSecurity.signAsync(transaction, privKey));
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
