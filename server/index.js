const express = require("express");
const app = express();
const cors = require("cors");

//libraries for cryptographic manipulation
//const {Signature } = require('ethereum-cryptography/seckp256k1')
const { secp256k1, Signature } = require('ethereum-cryptography/secp256k1')
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require('ethereum-cryptography/utils')
const { sha256 } = require('ethereum-cryptography/sha256')

const initialBalanceSet = [0,0,0,0,0,25,25,50,50,50,100,75,75,25,25,0,0,0,0];
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0x1": 100,
  "0x2": 50,
  "0x3": 75,
};

function getHashHex(msgString) {
  return toHex(sha256(utf8ToBytes(msgString)));
}

function hexToBytes(hex) {
  var bytes = [];

  for (var c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }

  return bytes;
};

function setInitialBalance(address) {
  if (!balances[address]) {
    //Instead of just setting the initial amount to 0, we choose a randdom between several options on initialBalanceSet
    balances[address] = initialBalanceSet[Math.floor(Math.random() * initialBalanceSet.length)];
  }
}

function getAddress(publicKey){
  return toHex(keccak256(publicKey.slice(1)).slice(-20));
}

const accounts = new Array();

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

/* Server entry points
  - /balance/:address ==> [GET]  allows to check the balance of an account
  - /createAccount  ====> [POST] allows to create a new account
  - /send ==============> [POST] allows to transfer an amount from oone accunt to another
 */

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  console.log("[BALANCE] GET Balance - Account: ", address, " Balance: ", balance );
  res.send({ balance });
});

app.post("/createAccount", (req, res) => {
  console.log("[CREATE] Create Account");
  const { address } = req.body;
  console.log("[CREATE] Creation requested for [", address, "]");
  //const _newAcc = new Account(name);

  //accounts[_newAcc.name]=_newAcc;
  setInitialBalance(address);
  console.log("[CREATE] account created - Balance: ", balances[address]);

  res.send({ balance: balances[address] });

});

app.post("/send", (req, res) => {
  const response = {
    result:"NOT SET",
    balances:{}
  };
  let statusCode = 200;

  console.log("[SEND] Data received:", req.body)

  const {sender, message, signature, senderPublicKey, recovery} = req.body

  if(signature ==="" || message.to === "" || sender === "" || recovery === "" || isNaN(recovery)){
    
    console.log("[SEND]  Incomplete / Wrong request ===> ERROR - Won't process")
    
    statusCode = 200;
    response.result = "Incomplete / Wrong request"

  }else{
    const hashMessage = getHashHex(JSON.stringify(message));
    //console.log("[SEND]  meesage hash ", hashMessage)
    //console.log("[SEND]  Public Key STR", senderPublicKey);
    //console.log("[SEND]  Public Key Array ", hexToBytes(senderPublicKey))
    //console.log("[SEND]  Test de signature ", secp256k1.Signature.fromCompact(signature));
    //console.log("[SEND]  Recivery Bit ", recovery)
    //console.log("[SEND]  Test de signature ", secp256k1.Signature.fromCompact(signature).addRecoveryBit(recovery));

    const result = secp256k1.verify(secp256k1.Signature.fromCompact(signature).addRecoveryBit(recovery),hashMessage,senderPublicKey);
    //console.log("[SEND]  Result of verification ", result)

    if(result){
      //signature valid. Check balances
      if (balances[sender] < message.value) {
        //Not enough funds
        statusCode = 200
        response.result = "Not enough funds"
        console.log("Not enough funds")
      }else{
        //console.log("[SEND]  Sender: ", sender)
        //console.log("[SEND]  To: ", message.to)
        //console.log("[SEND]  balances: ", balances);

        balances[sender] -= message.value;
        balances[message.to] += message.value;
        
        statusCode = 200;
        response.result = "OK"

        response.balances[sender] = balances[sender]
        response.balances[message.to] = balances[message.to]

        console.log("ALL OK")
      }
    }else{
      statusCode = 200
      response.result = "Verification ERROR. Signature couldn't be verified"
      console.log("[SEND]  Verification ERROR. Signature couldn't be verified")
    }

  }
  console.log("RETURN TO SENDER: ", statusCode, response);
  res.status(statusCode).send(response);

});


