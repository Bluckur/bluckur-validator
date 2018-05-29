// This class mimics a FIFO collection in javascript

const InitialConnector = require('../initialconnector.js')

module.exports = class Queue {
    constructor(length, data) {
        this.max = 4;
        this.data = [];
        if (data !== undefined && data !== null) {
            data.forEach(element => {
                this.add(element)
            });
        }
    }

    add(record) {
        if (record.ip && !record.ip !== new InitialConnector().MyIP() && !this.contains(record.ip)) {
            this.data.unshift(record);
            if (this.data.length > this.max) {
                this.remove();
            }
        }
    }

    remove() {
        let record = this.data.pop();
        record.client.emit('disconnect')
    }

    first() {
        if (this.data.length > 0) {
            return this.data[0];
        }
        return undefined;
    }

    last() {
        if (this.data.length > 0) {
            return this.data[this.data.length - 1];
        }
        return undefined;
    }

    size() {
        return this.data.length;
    }

    delete(socket) {
        let value = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].client === socket) {
                value = i;
                break;
            }
        }
        if (value != null) {
            this.data.splice(value, i);
        }
    }


    flip() {
        this.data.reverse();
    }

    clearSockets() {
        this.data.map(element => {
            ip: element.ip;
        });
    }

    copy() {
        let q = new Queue(this.max)
        q.data = this.data.map(element => {
            ip: element.ip
        });
        return q
    }

    isFull() {
        return this.max === this.size()
    }

    contains(ip) {
        return this.data.filter(element => element.ip === ip).length > 0;
    }
}