const SchemaObject = require('schema-object');
const BlockHeader = require('./blockHeader');
const Transaction = require('./transaction');

const Block = new SchemaObject({
  transaction: [Transaction],
  blockHeader: BlockHeader,
});

module.exports = Block;
