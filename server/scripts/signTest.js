//test to sign some content
const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes, hexToBytes  } = require("ethereum-cryptography/utils");
//const SHA256 = require('crypto-js/sha256'); 
//the above was used on the Alchemy course byt the ethereum-cryptography has one. so relying on 1 package
const { sha256 } = require("ethereum-cryptography/sha256");

//We need to form a message to hash. The message is:
//   - from address
//   - to address
//   - counter (nonce)
//   - amount

/*Data
Private Key:  0cd2683bd11f63f3fad1df0a9a29a1be9c4fea6f54f625e7103f85387bd49e4a
Public Key:   03d5b702e99ddcf1d49a6434a1be5d7d1938ed59c4d7411036d0bbf97d6b8a09fd
Address:  d6e6167fb64ebef8f1f1d9b9e855d9e1a663d104

Private Key:  cc0d77fad032390bc1c11ca8742a282e12fe235923130675a04d10d7e57f4a59
Public Key:   0379683cf0102088c6245bf0f799ef58e9998d2156e358257e4d86fa74e6aa98cc
Address:  a28ec069fa7b30576c50eebf9925ad54885e3a6a
*/
function getHashHex(msgString) {
    return toHex(sha256(utf8ToBytes(msgString)));
}

const publicKey1 = "03d5b702e99ddcf1d49a6434a1be5d7d1938ed59c4d7411036d0bbf97d6b8a09fd";
const publicKey2 = "0379683cf0102088c6245bf0f799ef58e9998d2156e358257e4d86fa74e6aa98cc";
const privateKey1 = hexToBytes("0cd2683bd11f63f3fad1df0a9a29a1be9c4fea6f54f625e7103f85387bd49e4a");
const privateKey2 = hexToBytes("cc0d77fad032390bc1c11ca8742a282e12fe235923130675a04d10d7e57f4a59");

const message1 = {
    "from": "a28ec069fa7b30576c50eebf9925ad54885e3a6a",
    "to": "d6e6167fb64ebef8f1f1d9b9e855d9e1a663d104",
    "counter": 75,
    "amount": 14,
  };

const message2 = {
    "from": "a28ec069fa7b30576c50eebf9925ad54885e3a6a",
    "to": "d6e6167fb64ebef8f1f1d9b9e855d9e1a663d104",
    "counter": 76,
    "amount": 14,
  };

const message3 = message1;

console.log("Message to hash:", message1);  
const hashMessage1 = getHashHex(JSON.stringify(message1));
console.log("Hash of message: ", hashMessage1);

console.log("Message to hash:", message2);  
const hashMessage2 = getHashHex(JSON.stringify(message2));
console.log("Hash of message: ", hashMessage2);

console.log("Message to hash:", message3);  
const hashMessage3 = getHashHex(JSON.stringify(message3));
console.log("Hash of message: ", hashMessage3);

console.log("message1 == message2", message1 === message2, "Hashes equal? ", hashMessage1===hashMessage2 );
console.log("message1 == message3", message1 === message3, "Hashes equal? ", hashMessage1===hashMessage3 );

//Sign message
const signature1 = secp256k1.sign(hashMessage1, privateKey1);
console.log("Signature: ", signature1);

//This is to check the signature once the publicKey is known
const isValid = secp256k1.verify(signature1, hashMessage1, publicKey1);
console.log("Signature Valid? ", isValid);

//But we usually only know the address so we need to get the publicKey from the signature
const extractedPublicKey = signature1.recoverPublicKey(hashMessage1).toRawBytes()
const extractedAddress = toHex(keccak256(extractedPublicKey.slice(1)).slice(-20))

//Verifications - the extracted should be the same and the validity should be ok too
console.log("Extracted Address:", extractedAddress);
console.log("Public keys identical?", toHex(extractedPublicKey) === publicKey1);
console.log("Validity of the Signature?", secp256k1.verify(signature1, hashMessage1, extractedPublicKey))


console.log(Math.random().toString(36).substr(2, 15))