const SchemaObject = require('schema-object');

const BlockHeader = new SchemaObject({
  blockVersion: Number,
  blockNumber: Number,
  coinbase: String,
  timestamp: Date,
  blockHash: String,
  parentHash: String,
  BLOCK_REWARD: Number,
});

module.exports = BlockHeader;
