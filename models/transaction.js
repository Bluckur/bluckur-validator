const bluckurSchemas = require('bluckur-models');
const SchemaObject = require('schema-object');

const Transaction = new SchemaObject(bluckurSchemas.transaction);

module.exports = Transaction;
