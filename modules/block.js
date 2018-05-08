const BlockHeader = require('./blockheader.js');
const Transaction = require('./transaction.js');

/**
 * [Block description]
 */
class Block {
    /**
     * [constructor description]
     * @param {json} data [description]
     */
    constructor(data) {
        this.transactions = [];
        if (data.constructorVersion === 1) {
            this.header = new BlockHeader(data);
            this.BLOCK_REWARD = 50;
        } else {
            this.deserialize(data);
        }
    }

    /**
     * [deserialize description]
     * @param {json} data [description]
     */
    deserialize(data) {
        const currentBlock = data.block;
        this.header = new BlockHeader({
            constructorVersion: 2,
            header: currentBlock.header,
        });
        this.BLOCK_REWARD = currentBlock.BLOCK_REWARD;
        for (let i = 0; i < currentBlock.transactions.length; i++) {
            this.addTransaction(new Transaction(currentBlock.transactions[i]));
        }
    }

    /**
     * Adds Transaction to list of block Transactions.
     * Transaction should already be checked for validity by Blockchain class,
     * since Block does not have access to all information.
     * @param {Transaction} transaction
     */
    addTransaction(transaction) {
        // Only add new Transactions if the block is not already finished.
        if (this.header.blockHash === '0' || this.header.blockHash === null) {
            this.transactions.push(transaction);
        }
    }

    /**
     * Sets the header's blockHash.
     */
    calculateBlockHash() {
        return new Promise((resolve, reject) => {
            this.header.calculateBlockHash(this.transactions).then((hash) => {
                this.header.blockHash = hash;
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Recalculates the blockHash with the current Array of Transactions,
     * and compares it to the blockHash in the header.
     * @return {boolean}
     */
    hasValidHeader() {
        return new Promise((resolve, reject) => {
            this.header.blockHash === this.header.calculateBlockHash(this.transactions).then((hash) => {
                resolve(this.header.blockHash === hash);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Gets the balance of an address for this block.
     * @param {string} address
     * @param {number} depth
     * @return {number}
     */
    getBlockBalanceOf(address, depth) {
        let balance = 0;
        // Check coinbase Transactions
        if (this.header.coinbase === address && depth > 0) {
            balance += this.BLOCK_REWARD;
        }
        let currentTransaction;
        for (let j = 0; j < this.transactions.length; j++) {
            currentTransaction = this.transactions[j];
            // Check incoming balance.
            if (currentTransaction.receiveraddress === address) {
                balance += currentTransaction.amount;
            }
            // Check outgoing balance.
            if (currentTransaction.senderpubkey === address) {
                balance -= currentTransaction.amount;
            }
        }
        return balance;
    }
}

module.exports = Block;
