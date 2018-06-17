// Singleton support
let instance = null;

class BlockchainValidator {
  validate(blocks) {
    if (this.validateGenesisBlock(blocks)) {
      const previousBlock = blocks[0];
      for (let i = 1; i < blocks.length; i += 1) {
        const { blockHeader: { blockHash, timestamp } } = blocks[i];
        if (previousBlock.blockHeader.blockHash !== blockHash ||
          previousBlock.blockHeader.timestamp >= timestamp) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  validateGenesisBlock(blocks) {
    const { blockHeader } = blocks[0];
    return blockHeader.validator === process.env.PUBKEY_ADMIN &&
      blockHeader.parentHash === '00000';
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
