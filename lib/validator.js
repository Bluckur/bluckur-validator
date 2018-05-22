const BlockchainService = require('./services/blockchainService');

function Validator() {
  this.blockchainService = BlockchainService.createInstance('pubKey');
}

const V = Validator.prototype;

V.initBlockchain = function initBlockchain() {
  this.blockchainService.createGenesisBlock().then((genisisBlock) => {
    console.log(genisisBlock);
  }).catch((err) => {
    console.log(err);
  });
};

module.exports = {
  createInstance() {
    return new Validator();
  },
};
