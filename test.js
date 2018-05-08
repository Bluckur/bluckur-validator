const BlockChain = require('./modules/blockchain.js');
const Transaction = require('./modules/transaction.js');
const BlockHeader = require('./modules/blockheader.js');
const Block = require('./modules/block.js');
const Security = require('./logic/security');

const coinbase = 'c4382b76386e73a8a37aff842fbfc1a02fd2b1f2eda74805911ac0505a69062d';
const privateKey = '0000000300050004000500050901000008060003000607000604050400000904c4382b76386e73a8a37aff842fbfc1a02fd2b1f2eda74805911ac0505a69062d';

const data = {
    senderpubkey: coinbase,
    receiveraddress: 'fred',
    amount: 1,
    timestamp: Date.now(),
};

process.setMaxListeners(0);

Security.signDetached(data, privateKey).then((signature) => {
    data.signature = signature;

    let blockchain = new BlockChain(coinbase, 'v1.1');

    var promises = []
    for (let i = 0; i < 100; i++) {
        promises.push(blockchain.addTransaction(new Transaction(data)));
    }
console.log('hsdfklajsdlfasdfsadf')
    Promise.all(promises).then(() => {
        console.log('here')
        console.log(blockchain.blocks.length);
        console.log(blockchain.getBalanceOf(coinbase));
        console.log(blockchain.getBalanceOf('fred'));
        console.log(JSON.stringify(blockchain));
        console.log(blockchain.isValid());
    }).catch((err) => {
        console.log(err);
    });
    console.log('hsdfklajsdlfasdfsadf')
});
