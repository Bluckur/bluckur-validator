//Handle all messages received, regardless of them being form the 'server' or 'client'

class Receiver {
    constructor(ioServer, ioClient){
        this.server = ioServer;
        this.client = ioClient;
    }
}

module.exports = Receiver;