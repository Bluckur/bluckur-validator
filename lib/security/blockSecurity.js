const Security = require('./security').getInstance();

// Singleton support
let instance = null;

class BlockSecurity {
  getHashAsync(block) {
    return new Promise((resolve, reject) => {
      const { blockHash, ...other } = block;
      Security.hashAsync(other).then((hash) => {
        resolve(hash);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockSecurity();
    }
    return instance;
  },
};
