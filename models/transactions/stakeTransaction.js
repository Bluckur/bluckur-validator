const Transaction = require('./transaction');

/**
 * [StakeTransaction description]
 * @extends Transaction
 */
module.exports = class StakeTransaction extends Transaction {
  constructor() {
    super();
    this.type = 'stake';
    this.sender = null;
    this.signature = null;
  }
};
