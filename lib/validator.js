const BlockchainService = require('./services/blockchainService');

function Validator() {
  this.blockchainService = BlockchainService.createInstance('pubKey');
}

const V = Validator.prototype;

module.exports = {
  createInstance() {
    return new Validator();
  },
};
