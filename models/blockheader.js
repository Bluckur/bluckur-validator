const bluckurSchemas = require('bluckur-models');
const SchemaObject = require('schema-object');

const BlockHeader = new SchemaObject(bluckurSchemas.blockHeader);

module.exports = BlockHeader;
