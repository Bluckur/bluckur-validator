const smoke = require('smokesignal');
const randomName = require('node-random-name');

module.exports = {
  createInstance(args) {
    // Checks arguments for needed values
    const checkedArgs = this.checkArguments(args);

    let node;
    if (checkedArgs.isBackup === 'true') {
      node = smoke.createNode({
        port: checkedArgs.port,
        address: checkedArgs.host,
        seeds: [
          { port: checkedArgs.backupPort, address: checkedArgs.backupHost2 },
        ],
        minPeerNo: 1,
        maxPeerNo: 9999999,
      });
      node.id = `backup/${randomName()}`;
    } else {
      node = smoke.createNode({
        port: checkedArgs.port,
        address: checkedArgs.host,
        seeds: [
          { port: checkedArgs.backupPort, address: checkedArgs.backupHost1 },
          { port: checkedArgs.backupPort, address: checkedArgs.backupHost2 },
        ],
        minPeerNo: 1,
        maxPeerNo: 4,
      });
      node.id = randomName();
    }
    return node;
  },
  checkArguments(args) {
    return {
      isBackup: args.isBackup || 'false',
      host: args.host || '127.0.0.1',
      port: args.port || 9177,
      backupHost1: args.backupHost1 || '127.0.0.1',
      backupHost2: args.backupHost2 || '127.0.0.1',
      backupPort: args.backupPort || 9178,
    };
  },
};
