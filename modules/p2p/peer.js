// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

/**
 * Default message
 */
class Peer {
    /**
     *
     * @param {{}} example
     */
    constructor() {
        io.on('connection', function(socket) {
            console.log('A user connected');

            //Send a message after a timeout of 4seconds
            setTimeout(function() {
                socket.send('Sent a message 4seconds after connection!');
            }, 4000);

            socket.on('disconnect', function() {
                console.log('A user disconnected');
            });
        });
    }
}

module.exports = Peer;
