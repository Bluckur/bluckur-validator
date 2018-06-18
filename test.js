require('dotenv').config();
const Validator = require('./lib/validator').getInstance();
const Models = require('bluckur-models');
const TransactionSecurity = require('./lib/security/transactionSecurity').getInstance();
const Security = require('./lib/security/security').getInstance();

// Security.generateKeyPair(Security.generateMnemonic()).then((pair) => {
//   console.log(pair);
// });

const t1 = Models.createTransactionInstance({
  recipient: 'Klaas',
  amount: 4,
  timestamp: +new Date(),
  type: 'coin',
  sender: process.env.PUBKEY_ADMIN,
  blockHash: 'iets',
});
//
// const t2 = Models.createTransactionInstance({
//   recipient: 'testietostie123',
//   amount: 3,
//   timestamp: +new Date(),
//   type: 'coin',
//   sender: process.env.PUBKEY_ADMIN,
//   blockHash: 'iets',
// });
//
// const b1 = Models.createBlockInstance({
//   transactions: [],
//   blockHeader: Models.createBlockHeaderInstance({
//     blockNumber: 1,
//     validator: process.env.PUBKEY_ADMIN,
//     timestamp: +new Date(),
//     blockReward: 20,
//     parentHash: 'd27ea11778e7a0d3543242c582f3a5095f1ef149eaa2b7bb012726aa2fea92de',
//   }),
// });
//
// let st1;
// let st2;
// TransactionSecurity.signAsync(t1, process.env.PRIVKEY_ADMIN).then((signedTransaction1) => {
//   st1 = signedTransaction1;
//   return TransactionSecurity.signAsync(t2, process.env.PRIVKEY_ADMIN);
// }).then((signedTransaction2) => {
//   st2 = signedTransaction2;
//   console.log(b1);
//   b1.transactions.push(st1);
//   b1.transactions.push(st2);
//   return Validator.handleNewBlockAsync(b1);
// }).then(() => {
//   console.log('Success!');
// }).catch((err) => {
//   console.log(err);
// });
//
// TransactionSecurity.signAsync(t1, '08090009000000000000000000010008090703000000000300050000000200005f41601a755d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb').then((transaction) => {
//   Validator.handleNewTransactionAsync(transaction).then(() => {
//     console.log('Success!');
//   }).catch((err) => {
//     console.log(err);
//   });
// });

Validator.initBlockchainAsync().then(() => {
  console.log('Blockchain initialized');
}).catch((err) => {
  console.log(err);
});
