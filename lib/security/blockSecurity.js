const Security = require('./security').createInstance();

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
  createInstance() {
    return new BlockSecurity();
  },
};
