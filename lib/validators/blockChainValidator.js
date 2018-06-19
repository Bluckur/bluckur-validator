// Singleton support
let instance = null;

class BlockchainValidator {
  validate(blocks) {
    const previousBlock = blocks[0];
    for (let i = 1; i < blocks.length; i += 1) {
      const { blockHeader: { blockHash, timestamp } } = blocks[i];
      if (previousBlock.blockHeader.blockHash !== blockHash) {
        return false;
      }
      previousBlock = blocks[i]
    }
    return true;
  }
}

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockchainValidator();
    }
    return instance;
  },
};