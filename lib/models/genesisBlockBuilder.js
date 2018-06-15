const Security = require('./../util/security');
const Models = require('bluckur-models');

class GenesisBlockBuilder {
  constructor() {

  }

  buildAsync() {
    const transactions =
    const
  }

  createTransactionsAsync() {
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

  
}

const genenisBlock = Models.createBlockInstance({
  transactions: [
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
  ],
  blockHeader: Models.createBlockHeaderInstance({
    blockNumber: 0,
    validator: process.env.PUBLICKEY_ADMIN,
    timestamp: +new Date(),
    blockReward: this.BLOCK_REWARD,
    parentHash: '0',
  }),
});

module.exports = {
  createInstanceAsync() {
    return new Promise((resolve, reject) => {

    });
  },
};
