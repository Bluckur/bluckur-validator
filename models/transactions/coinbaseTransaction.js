const Transaction = require('./transaction');

module.exports = class CoinbaseTransaction extends Transaction {
  constructor() {
    super();
    this.type = 'coin';
  }
};
