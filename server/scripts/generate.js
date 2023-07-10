//script para generar claves privadas para las wallets que vamos a usar
//const secp = require('ethereum-cryptography/secp256k1')
const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");

//import { secp } from "ethereum-cryptography/secp256k1";
//const {secp256k1} = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

//*** Obtener la clave privada*/
//const privateKey = secp.secp256k1.utils.randomPrivateKey();
const privateKey = secp256k1.utils.randomPrivateKey();

console.log("Private Key: ", toHex(privateKey));

//*** Obtener la clave publica */
const publicKey  = secp256k1.getPublicKey(privateKey);
console.log("Public Key:  ", toHex(publicKey));

//*** Obtener la direccion al estilo Ethereum */
const address = keccak256(publicKey.slice(1)).slice(-20);
console.log("Address: ", toHex(address));