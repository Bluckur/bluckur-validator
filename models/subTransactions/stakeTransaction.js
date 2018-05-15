const Transaction = require('./../transaction');

const StakeTransaction = new Transaction.extend({ // eslint-disable-line new-cap
  sender: String,
  signature: String,
  type: { type: String, default: 'coin' },
});

module.exports = StakeTransaction;
