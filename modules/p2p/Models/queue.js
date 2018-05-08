// Create a queue-like thing for Java


class Queue {

    constructor(length) {
        this.max = length;
        this.data = [];
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
        return this.data[0];
    }

    last() {
        return this.data[this.data.length - 1];
    }

    size() {
        return this.data.length;
    }

    flip() {
        this.data.reverse();
    }
}