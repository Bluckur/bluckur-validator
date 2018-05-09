const Transaction = require('./../transaction');

const CoinTransaction = new Transaction.extend({ // eslint-disable-line new-cap
  sender: String,
  signature: String,
  type: { type: String, default: 'coin' },
});

module.exports = CoinTransaction;
