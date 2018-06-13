require('dotenv').config();

const Validator = require('./lib/validator');
const Receiver = require('./services/receiver.js');
const Sender = require('./services/sender');
const nodeFactory = require('./services/nodeFactory.js');
const Messager = require('./util/messager');
const QrCodeGenerator = require('./services/qrCodeGenerator');
const opn = require('opn');
const express = require('express');
const http = require('http');
const Models = require('bluckur-models');
const Security = require('./lib/security/security').getInstance();

const qrCodeGenerator = new QrCodeGenerator();

// Configuration for node initiation
const nodeConfig = {
  isBackup: process.env.IS_BACKUP,
  host: process.env.NODE_HOST,
  port: 9177,
  backupHost1: process.env.BACKUP_1_HOST,
  backupHost2: process.env.BACKUP_2_HOST,
  backupPort: 9178,
};

let io = require('socket.io');

let sender;
let node;
let messager;
let connected = false;
const PORT = 9177;

// Initialize app with Express
const app = express();
app.use(express.static(`${__dirname}/public`));

// Redirect default '/' call to main.htm page
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Start listening with HTTP (picks random available port)
const server = http.createServer(app).listen();

// Open default browser after server creation
opn(`http://localhost:${server.address().port}`, (err) => {
  console.log(err);
});

/** */
function initNode() {
  node = nodeFactory.createInstance(nodeConfig);

  // Enable sending and receiving messages
  sender = new Sender(node);
  const receiver = new Receiver(sender, node, messager);
  receiver.initDefaultListeners();
  receiver.initCustomListeners();

  node.start();
  connected = true;
  console.log('Validator listening on port %s', PORT);

  // Security.generateKeyPair(Security.generateMnemonic()).then((keyPair) => {
  //   console.log(keyPair);
  // });

  const pubKey = '75821586eeee3dc40f7ef83df809c9a38de017ed3adaed8130becd267f5eeffb';
  const privKey = '050004040300010000000000000400070006000403070900010000000504000075821586eeee3dc40f7ef83df809c9a38de017ed3adaed8130becd267f5eeffb';
  const validator = Validator.createInstance();
  validator.initBlockchainAsync().then(() => {
    const transaction = Models.createTransactionInstance({
      recipient: pubKey,
      amount: 1,
      timestamp: +new Date(),
      type: 'coin',
      sender: pubKey,
    });
    Security.signDetached({
      recipient: transaction.recipient,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      type: transaction.type,
      sender: transaction.sender,
    }, privKey).then((signature) => {
      transaction.signature = signature;
      validator.addPendingTransactionAsync(transaction);
    }).catch((err) => {
      console.log(err);
    });
  }).catch((err) => {
    console.log(err);
  });
}

// Start listening with WebSockets
io = io.listen(server);

io.on('connection', (socket) => {
  // Initialize logger for real-time webpage logging
  if (!connected) {
    messager = new Messager(socket);
    initNode();
  }

  socket.emit('node-initialized', JSON.stringify({
    id: node.id,
    port: PORT,
    isBackup: process.env.IS_BACKUP,
  }));

  socket.on('node-data', () => {
    initNode();
    messager.notify('node-initialized', JSON.stringify({
      id: node.id,
      port: PORT,
      isBackup: process.env.IS_BACKUP,
    }));
  });

  socket.on('broadcast-message', (data) => {
    if (sender) {
      // For testing purposes
      sender.broadcastTransaction(JSON.parse(data.toString('utf8')).message);
    }
  });

  socket.on('broadcast-chatmessage', (data) => {
    if (sender) {
      const { message } = JSON.parse(data.toString('utf8'));
      const sendername = node.id;
      const broadcastMessage = { message, sender: sendername };
      sender.broadcastMessage(broadcastMessage);
    }
  });

  socket.on('generate-keypair', () => {
    const mnemonic = Security.generateMnemonic();
    const keypair = Security.generateKeyPair(mnemonic);
    messager.notify('keypair', {
      pubkey: keypair.pubKey,
      privkey: keypair.privKey,
    });
  });

  socket.on('set-pubkey', () => {
    messager.notify('pubkey-set', JSON.stringify({
      test: 'test',
    }));
  });

  socket.on('generate-transaction-data', () => {
    messager.notify('transaction-generated', JSON.stringify({
      transaction: 'transaction',
    }));
  });

  socket.on('publish-transaction', () => {
    messager.notify('transaction-published', JSON.stringify({
      transaction: 'transaction',
    }));
  });

  socket.on('generate-qr-code-request', (data) => {
    qrCodeGenerator.generateQrCodeAsync(data).then((url) => {
      messager.notify('generate-qr-code-reply', url);
    }).catch((err) => {
      console.log(err);
    });
  });
});
