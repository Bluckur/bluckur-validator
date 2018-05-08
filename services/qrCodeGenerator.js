const QRCode = require('qrcode');

function QrCodeGenerator() {

}

const Q = QrCodeGenerator.prototype;

Q.generateQrCodeAsync = function generateQrCodeAsync(data) {
  return new Promise((resolve, reject) => {
    // With promises
    QRCode.toDataURL(data).then((url) => {
        resolve(url);
      }).catch((err) => {
        reject(err);
      });
  });

module.exports = QrCodeGenerator;
