const uuid = require('uuid');

/**
 * Default message
 */
class Message {
    /**
     *
     * @param {Node} node
     * @param {string} context
     * @param {{}} data
     */
    constructor(node, context, data) {
        this.id = uuid();
        this.timestamp = new Date;
        this.source = {
            id: node.id,
            host: node.options.address,
            port: node.options.port,
        };
        this.context = context;
        this.data = data;
        this.recipients = [];
    }

    /**
     *
     * @param {Node} nodeId
     */
    addRecipient(nodeId) {
        if (this.recipients.indexOf(nodeId) === -1) {
            this.recipients.push(nodeId);
        }
    }
}

module.exports = Message;
