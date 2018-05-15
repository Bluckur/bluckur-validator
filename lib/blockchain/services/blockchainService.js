const models = require('bluckur-models');

const blockService = require('./blockService').getInstance();

let instance = null;

function BlockchainService() {
  this.blocks = [];
}

const B = BlockchainService.prototype;

B.validateChain = function validateChain() {

};

B.addBlock = function addBlock() {

};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockchainService();
    }
    return instance;
  },
};
