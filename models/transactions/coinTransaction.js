const Transaction = require('./transaction');

module.exports = class CoinTransaction extends Transaction {
  constructor() {
    super();
    this.type = 'coin';
    this.sender = null;
    this.signature = null;
  }
};
