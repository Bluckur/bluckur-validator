class TransactionSecurity {
  constructor(security) {
    this.security = security;
  }

  signAsync(transaction, privateKey) {
    return new Promise((resolve, reject) => {
      const { signature, blockHash, ...other } = transaction;
      this.security.signDetachedAsync(other, privateKey).then((detachedSignature) => {
        transaction.signature = detachedSignature; // eslint-disable-line no-param-reassign
        resolve(detachedSignature);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  verifySignatureAsync(transaction) {
    return new Promise((resolve, reject) => {
      const { signature, blockHash, ...other } = transaction;
      this.security.verifyDetachedAsync(signature, other.sender, other).then((isValid) => {
        resolve(isValid);
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
    return new TransactionSecurity(security);
  },
};
