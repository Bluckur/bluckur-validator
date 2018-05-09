const SchemaObject = require('schema-object');

const Transaction = new SchemaObject({
  recipient: String,
  amount: Number,
  timestamp: Date,
  type: { type: String, default: 'default' },
});

module.exports = Transaction;
