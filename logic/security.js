const bip39 = require('bip39');
const naclFactory = require('js-nacl');

// For debugging (true = debug-mode, false=no debug)
const verbose = false;

/**
 * [Security description]
 */
class Security {
  /**
     * [sign description]
     * @param  {[json]} message    [description]
     * @param  {[string]} privateKey [description]
     * @return {[Promise]}            [description]
     */
  static sign(message, privateKey) {
    return new Promise((resolve, reject) => {
      if (!message || !privateKey) {
        throw new Error('invalid message');
      } else {
        naclFactory.instantiate((nacl) => {
          try {
            // Convert and ensure data
            const data = this.createData(message);

            // Convert data to bytestring
            const messagBytes = this.messageToBytes(data);

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
  }

  /**
     * [signDetached description]
     * @param  {[json]} message    [description]
     * @param  {[string]} privateKey [description]
     * @return {[Promise]}            [description]
     */
  static signDetached(message, privateKey) {
    return new Promise((resolve, reject) => {
      if (!message || !privateKey) {
        reject(new Error('invalid message'));
      } else {
        naclFactory.instantiate((nacl) => {
          try {
            // Convert and ensure data
            const data = this.createData(message);

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
  }

  /**
     *
     * @param {string} message
     * @return {*} buffer
     */
  static messageToBytes(message) {
    return Buffer.from(message, 'utf8');
  }

  /**
     *
     * @param {string} signature
     * @param {string} pubKey
     * @return {string} message
     */
  static verify(signature, pubKey) {
    return new Promise((resolve, reject) => {
      if (!signature | !pubKey) {
        reject(new Error('invalid message'));
      } else {
        naclFactory.instantiate((nacl) => {
          const publicKeyBytes = this.hexToBytes(pubKey);
          const signatureBin = this.hexToBytes(this.signature);
          // Decode message from packet with public key
          const hexString = nacl.to_hex(nacl.crypto_sign_open(signatureBin, publicKeyBytes)).toString();

          // Convert hex to string
          let message = '';
          for (let i = 0; i < hexString.length; i += 2) {
            message += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
          }
          this.debug(`Message: ${message}`);
          resolve(message);
        });
      }
    });
  }

  /**
     *
     * @param {string} message
     * @param {string} signature
     * @param {string} pubKey
     * @return {*} result
     */
  static verifyDetached(signature, data) {
    return new Promise((resolve, reject) => {
      naclFactory.instantiate((nacl) => {
        const signPubKey = this.hexToBytes(pubKey);
        const signatureBin = this.hexToBytes(signature);
        // extract data from message without the signature.
        const data = this.createData(message);
        try {
          // Convert message to bytestring
          const msgBytes = this.messageToBytes(JSON.stringify(data));
          // Decode message from packet with public key
          const result = nacl.crypto_sign_verify_detached(signatureBin, msgBytes, signPubKey);
          this.debug(`Result: ${result}`);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
     * @return {string} mnemonicString
     */
  static generateMnemonic() {
    // Generate random new keypair
    const mnemonic = bip39.generateMnemonic(); // /Maybe add seed or other wordlist to generating
    this.debug(`Mnemonic: ${mnemonic}`);

    return mnemonic;
  }

  /**
     *
     * @param {string} mnemonic
     * @return {*} keypair
     */
  static generateKeyPair(mnemonic) {
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
  }

  /**
     *
     * @param {string} pubKey
     * @return {string} address
     */
  static generateAddress(pubKey) {
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
  }

  /**
     * [hexToBytes description]
     * @param  {[string]} hex [description]
     * @return {[array]} byteArray    [description]
     */
  static hexToBytes(hex) {
    if (!hex) {
      return new Uint8Array(); // eslint-disable-line no-undef
    }
    const bytes = [];
    for (let i = 0, len = hex.length; i < len; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes); // eslint-disable-line no-undef
  }

  /**
     *
     * @param {string} message
     */
  static debug(message) {
    if (verbose) console.log(message);
  }

  /**
     *
     * @param {string} data
     * @return {*} hash
     */
  static hash(data) {
    return new Promise((resolve, reject) => {
      if (!data) {
        reject(new Error('Can\'t hash invalid data'));
      } else {
        naclFactory.instantiate((nacl) => {
          const hash = nacl.to_hex(nacl.crypto_hash_sha256(data));
          resolve(hash);
        });
      }
    });
  }

  /**
     * [createData description]
     * @param  {[type]} message [description]
     * @return {[type]}         [description]
     */
  static createData(message) {
    if (message.senderpubkey && message.receiveraddress &&
            message.amount && message.timestamp) {
      return {
        senderpubkey: message.senderpubkey,
        receiveraddress: message.receiveraddress,
        amount: message.amount,
        timestamp: message.timestamp,
      };
    }
    throw new Error('invalid message');
  }
}

module.exports = Security;
