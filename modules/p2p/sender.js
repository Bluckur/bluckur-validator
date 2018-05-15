//Handle all messages to send, regardless of them being form the 'server' or 'client'

class Sender {
    constructor(ioServer, ioClient){
        this.server = ioServer;
        this.client = ioClient;

        //Example server send:
        //socket will come from the Queue
        //socket.emit("message_isAlive", "Yes, I am online")

        //Example client send:
        //client.emit('seq-num', sequenceNumber);
    }
}

module.exports = Sender;