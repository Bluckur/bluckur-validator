const Security = require('./security').getInstance();

// Singleton support
let instance = null;

class BlockSecurity {
    getHashAsync(block) {
        return new Promise((resolve, reject) => {
            const { blockHash, ...other } = block.blockHeader;
            console.log('firsthash: ' + blockHash);
            Security.hashAsync({
                blockHeader: other,
                transactions: block.transactions,
            }).then((hash) => {
                console.log('secondhash: ' + hash);
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