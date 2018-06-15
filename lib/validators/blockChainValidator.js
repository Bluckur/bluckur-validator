// Singleton support
let instance = null;

class BlockchainValidator {
  constructor(blockValidator) {
    this.blockValidator = blockValidator;
  }

  validateAsync(blockChain) {
    return new Promise((resolve, reject) => {

    });
  }
}

module.exports = {
  getInstance(blockValidator) {
    if (!instance) {
      if (!blockValidator) {
        throw new Error('Invalid argument(s)');
      }
      instance = new BlockchainValidator(blockValidator);
    }
    return instance;
  },
};
