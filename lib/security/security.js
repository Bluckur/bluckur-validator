const bip39 = require('bip39');
const naclFactory = require('js-nacl');

// For debugging (true = debug-mode, false=no debug)
const verbose = false;

let instance = null;

function Security() {}

const S = Security.prototype;

S.signAsync = function sign(message, privateKey) {
  return new Promise((resolve, reject) => {
    if (!message || !privateKey) {
      throw new Error('invalid message');
    } else {
      naclFactory.instantiate((nacl) => {
        try {
          // Convert data to bytestring
          const messagBytes = this.messageToBytes(message);

          // Sign message and package up into packet
          const signatureBin = nacl.crypto_sign(messagBytes, this.hexToBytes(privateKey));
          const signature = nacl.to_hex(signatureBin);

          this.debug(`Signature: ${signature}`);

          resolve(signature);
        } catch (err) {
          reject(err);
        }
      });
    }
  });
};

S.signDetachedAsync = function signDetachedAsync(data, privateKey) {
  return new Promise((resolve, reject) => {
    if (!data || !privateKey) {
      reject(new Error('invalid message'));
    } else {
      naclFactory.instantiate((nacl) => {
        try {
          // Convert message to bytestring
          const messageBytes = this.messageToBytes(JSON.stringify(data));
          // Sign message and package up into packet
          const detachedSignatureBin = nacl.crypto_sign_detached(messageBytes, this.hexToBytes(privateKey));
          const detachedSignature = nacl.to_hex(detachedSignatureBin);
          this.debug(`Signature: ${detachedSignature}`);
          resolve(detachedSignature);
        } catch (err) {
          reject(err);
        }
      });
    }
  });
};

S.messageToBytes = function messageBytes(message) {
  return Buffer.from(JSON.stringify(message), 'utf8');
};

S.verifyAsync = function verifyAsync(signature, pubKey) {
  return new Promise((resolve, reject) => {
    if (!signature || !pubKey) {
      reject(new Error('invalid message'));
    } else {
      naclFactory.instantiate((nacl) => {
        const publicKeyBytes = this.hexToBytes(pubKey);
        const signatureBytes = this.hexToBytes(signature);
        // Decode message from packet with public key
        const a = nacl.crypto_sign_open(signatureBytes, publicKeyBytes);
        const b = nacl.to_hex(a);
        // Convert hex to string
        let message = '';
        for (let i = 0; i < b.length; i += 2) {
          message += String.fromCharCode(parseInt(b.substr(i, 2), 16));
        }
        this.debug(`Message: ${message}`);
        resolve(message);
      });
    }
  });
};

S.verifyDetachedAsync = function verifyDetachedAsync(signature, publicKey, data) {
  return new Promise((resolve, reject) => {
    naclFactory.instantiate((nacl) => {
      const pulicKeyBin = this.hexToBytes(publicKey);
      const signatureBin = this.hexToBytes(signature);
      try {
        // Convert message to bytestring
        const msgBytes = this.messageToBytes(JSON.stringify(data));
        // Decode message from packet with public key
        const result = nacl.crypto_sign_verify_detached(signatureBin, msgBytes, pulicKeyBin);
        this.debug(`Result: ${result}`);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
};

S.generateMnemonic = function generateMnemonic() {
  // Generate random new keypair
  const mnemonic = bip39.generateMnemonic(); // /Maybe add seed or other wordlist to generating
  this.debug(`Mnemonic: ${mnemonic}`);

  return mnemonic;
};

/**
 *
 * @param {string} mnemonic
 * @return {*} keypair
 */
S.generateKeyPair = function generateMnemonic(mnemonic) {
  return new Promise((resolve, reject) => {
    if (!mnemonic) {
      reject(new Error('invalid message'));
    } else {
      naclFactory.instantiate((nacl) => {
        // Generate private(signSk) and public(signPk) key
        const { signPk, signSk } = nacl.crypto_sign_seed_keypair(bip39.mnemonicToEntropy(mnemonic));
        const pubKey = nacl.to_hex(signPk);
        const privKey = nacl.to_hex(signSk);

        this.debug(`Public Key: ${pubKey}`);
        this.debug(`Private Key: ${privKey}`);

        resolve({ pubKey, privKey });
      });
    }
  });
};

/**
 *
 * @param {string} pubKey
 * @return {string} address
 */
S.generateAddress = function generateAddress(pubKey) {
  return new Promise((resolve, reject) => {
    if (!pubKey) {
      reject(new Error('invalid message'));
    } else {
      naclFactory.instantiate((nacl) => {
        const signPubKey = this.hexToBytes(pubKey);
        // Hash public key, take first 8 bytes
        const hash = Buffer.from(nacl.crypto_hash_sha256(nacl.crypto_hash_sha256(signPubKey)))
          .slice(0, 11);

        // Start with SNOW followed by the hex of the bytes
        const address = `SNOW ${nacl.to_hex(hash)}`;

        this.debug(`Address: ${address}`);

        resolve(address);
      });
    }
  });
};

S.hexToBytes = function hexToBytes(hex) {
  if (!hex) {
    return new Uint8Array(); // eslint-disable-line no-undef
  }
  const bytes = [];
  for (let i = 0, len = hex.length; i < len; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes); // eslint-disable-line no-undef
};

S.debug = function debug(message) {
  if (verbose) console.log(message);
};

/**
 * [hashAsync description]
 * @param  {Object} data [description]
 * @return {Promise}      [description]
 */
S.hashAsync = function hashAsync(data) {
  return new Promise((resolve) => {
    naclFactory.instantiate((nacl) => {
      const hash = nacl.to_hex(nacl.crypto_hash_sha256(JSON.stringify(data)));
      resolve(hash);
    });
  });
};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new Security();
    }
    return instance;
  },
};
