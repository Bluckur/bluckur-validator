class BlockSecurity {
  constructor(security) {
    this.security = security;
  }

  getHashAsync(block) {
    return new Promise((resolve, reject) => {
      const { blockHash, ...other } = block;
      this.security.hashAsync(other).then((hash) => {
        resolve(hash);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

module.exports = {
  createInstance(security) {
    if (!security) {
      throw new Error('Invalid argument(s)');
    }
    return new BlockSecurity(security);
  },
};
