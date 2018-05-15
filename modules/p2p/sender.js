//Handle all messages to send, regardless of them being form the 'server' or 'client'

class Sender {
    constructor(ioServer, ioClient){
        this.server = ioServer;
        this.client = ioClient;
    }
}

module.exports = Sender;