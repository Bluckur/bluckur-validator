// This class mimics a FIFO collection in javascript

module.exports = class Queue {
    constructor(length, data) {
        this.max = 4;
        if(!data && data !== null){
            this.data = [];
        }else{
            this.data = data;
        }
    }

    add(record) {
        this.data.unshift(record);
        if (this.data.length > this.max) {
            this.remove();
        }
    }

    remove() {
        this.data.pop();
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

    flip() {
        this.data.reverse();
    }

    clearSockets(){
        this.data.forEach(element => {
            element.client = undefined;
        });
    }

    copy() {
        let q = new Queue(this.max)
        q.data = this.data.map(element => {
            ip: element.ip
        });
        return q
    }

    isFull(){
        return this.max === this.size()
    }
}
