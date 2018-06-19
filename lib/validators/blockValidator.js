const Models = require('bluckur-models');
const BlockSecurity = require('./../security/blockSecurity').getInstance();
const TransactionValidator = require('./transactionValidator');

// Singleton support
let instance = null;

class BlockValidator {
    /**
     * [constructor description]
     * @param {MasterRepository} database [description]
     */
    constructor(database) {
        this.database = database;
        this.transactionValidator = TransactionValidator.getInstance(this.database);
    }

    /**
     * [validateAsync description]
     * @param  {Block} block [description]
     * @return {Promise}       [description]
     */
    validateAsync(block) {
        return new Promise((resolve, reject) => {
            if (this.validateProperties(block)) {
                this.validateHashAsync(block).then(() => {
                    return this.validateParentHashAsync(block);
                }).then(() => {
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            } else {
                reject(new Error('Properties are invalid'));
            }
        });
    }

    validateTransactionsAsync(block) {
        return new Promise((resolve, reject) => {
            const promises = [];
            block.transactions.forEach((transaction) => {
                promises.push(this.transactionValidator.validateAsync(transaction));
            });
            Promise.all(promises).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * [validateHashAsync description]
     * @param  {Block} block [description]
     * @return {Promise}       [description]
     */
    validateHashAsync(block) {
        return new Promise((resolve, reject) => {
            BlockSecurity.getHashAsync(block).then((hash) => {
                if (block.blockHeader.blockHash === hash) {
                    resolve();
                } else {
                    reject(new Error('Hash is invalid'));
                }
            });
        });
    }

    /**
     * [validateParentHashAsync description]
     * @param  {Block} block [description]
     * @return {Promise}       [description]
     */
    validateParentHashAsync(block) {
        return new Promise((resolve, reject) => {
            this.getPreviousBlockHashAsync(block).then((previousBlockHash) => {
                if (previousBlockHash === block.blockHeader.parentHash) {
                    resolve();
                } else {
                    reject(new Error('Parent hash is invalid'));
                }
            });
        });
    }

    /**
     * [validateProperties description]
     * @param  {Block} block [description]
     * @return {Boolean}       [description]
     */
    validateProperties(block) {
        const { blockHeader } = block;
        const validschema = Models.validateBlockSchema(block);
        const validprops = this.hasTruthyProperties(block);
        const validtime = blockHeader.timestamp !== -1;
        return validschema && validprops && validtime;
    }

    /**
     *
     * @param  {Block} block [description]
     * @return {Promise}       [description]
     */
    getPreviousBlockHashAsync(block) {
        return new Promise((resolve, reject) => {
            this.database.getBlockAsync(block.blockHeader.blockNumber - 1).then((previousBlock) => {
                resolve(previousBlock.blockHeader.blockHash);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * [hasTruthyProperties description]
     * @param  {Block}  block [description]
     * @return {Boolean}       [description]
     */
    hasTruthyProperties(block) {
        const { transactions, blockHeader } = block;
        return blockHeader &&
            blockHeader.version &&
            blockHeader.blockNumber &&
            blockHeader.validator &&
            blockHeader.timestamp &&
            blockHeader.blockReward &&
            blockHeader.blockHash &&
            blockHeader.parentHash &&
            transactions;
    }
}

module.exports = {
    /**
     * [getInstance description]
     * @param  {MasterRepository} database [description]
     * @return {BlockValidator}          [description]
     */
    getInstance(database) {
        if (!instance) {
            if (!database) {
                throw new Error('Invalid argument(s)');
            }
            instance = new BlockValidator(database);
        }
        return instance;
    },
};