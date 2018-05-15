const Transaction = require('./../transaction');

const CoinbaseTransaction = new Transaction.extend({ // eslint-disable-line new-cap
  type: { type: String, default: 'coin' },
});

module.exports = CoinbaseTransaction;
