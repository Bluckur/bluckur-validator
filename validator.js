'use strict';

require('dotenv').config();

const Receiver = require('./services/receiver.js');
const Sender = require('./services/sender');
const NodeProvider = require('./services/nodeProvider.js');
const Messager = require('./util/messager');
const Security = require('./logic/security');
const opn = require('opn');
const express = require('express');
const http = require('http');

let io = require('socket.io');

let sender;
let node;
let messager;
let connected = false;
let PORT = 9177;

// Initialize app with Express
const app = express();
app.use(express.static(__dirname + '/public'));

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

    socket.on('node-data', (data) => {
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
            let message = JSON.parse(data.toString('utf8')).message;
            let sendername = node.id;
            let broadcastMessage = { 'message': message, 'sender': sendername };
            sender.broadcastMessage(broadcastMessage);
        }
    });
    socket.on('generate-keypair', (data) => {
        let mnemonic = Security.generateMnemonic();
        let keypair = Security.generateKeyPair(mnemonic);
        messager.notify('keypair', {
            pubkey: keypair.pubKey,
            privkey: keypair.privKey,
        });
    });

    socket.on('set-pubkey', (data) => {
        messager.notify('pubkey-set', JSON.stringify({
            test: 'test',
        }));
    });

    socket.on('generate-transaction-data', (data) => {
        messager.notify('transaction-generated', JSON.stringify({
            transaction: 'transaction',
        }));
    });

    socket.on('publish-transaction', (data) => {
        messager.notify('transaction-published', JSON.stringify({
            transaction: 'transaction',
        }));
    });
});
/** */
function initNode() {
    node = new NodeProvider().createNode();

    // Enable sending and receiving messages
    sender = new Sender(node);
    new Receiver(sender, node, messager);

    node.start();
    connected = true;
    console.log('Validator listening on port %s', PORT);
}
