require('dotenv').config();
require('./lib/validator').getInstance();
// const Models = require('bluckur-models');
// const TransactionSecurity = require('./lib/security/transactionSecurity').getInstance();
// const Security = require('./lib/security/security').getInstance();

// Security.generateKeyPair(Security.generateMnemonic()).then((pair) => {
//   console.log(pair);
// });

// const t1 = Models.createTransactionInstance({
//   recipient: 'testietostie123',
//   amount: 5,
//   timestamp: +new Date(),
//   type: 'coin',
//   sender: process.env.PUBKEY_ADMIN,
//   blockHash: 'iets',
// });


// TransactionSecurity.signAsync(t1, '08090009000000000000000000010008090703000000000300050000000200005f41601a755d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb').then((transaction) => {
//   Validator.handleNewTransactionAsync(transaction).then(() => {
//     console.log('Success!');
//   }).catch((err) => {
//     console.log(err);
//   });
// });
//
// Validator.initBlockchainAsync().then(() => {
//   console.log('Blockchain initialized');
// }).catch((err) => {
//   console.log(err);
// });
// Validator.initBlockchainAsync().then(() => {
//   console.log('Blockchain initialized');
// }).catch((err) => {
//   console.log(err);
// });
//
// const t1 = Models.createTransactionInstance({
//   recipient: 'Klaas',
//   amount: 4,
//   timestamp: +new Date(),
//   type: 'coin',
//   sender: process.env.PUBKEY_ADMIN,
//   blockHash: 'iets',
// });
//
// const t2 = Models.createTransactionInstance({
//   recipient: 'testietostie123',
//   amount: 1,
//   timestamp: +new Date(),
//   type: 'stake',
//   sender: '5f41601ad55d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb',
//   blockHash: 'iets',
// });
/*
TransactionSecurity.signAsync(t1, '08090009000000000000000000010008090703000000000300050000000200005f41601a755d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb').then((transaction) => {
  Validator.handleNewTransactionAsync(transaction).then(() => {
    console.log('Success!');
  }).catch((err) => {
    console.log(err);
  });
});

TransactionSecurity.signAsync(t2, '08090009000000000000000000010008090703000000000300050000000200005f41601a755d510cf6341e6b15ac41e07f88e0d0eb88270dd0ada2d25fb869fb').then((transaction) => {
  Validator.handleNewTransactionAsync(transaction).then(() => {
    console.log('Success!');
  }).catch((err) => {
    console.log(err);
  });
}); */
