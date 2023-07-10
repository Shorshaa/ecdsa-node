//libraries for cryptographic manipulation
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";
import { sha256 } from "ethereum-cryptography/sha256";

const initialBalance = [0,0,30,0,0,25,25,50,150,50,100,75,75,25,25,0,0,20,0];

function getHashHex(msgString) {
  return toHex(sha256(utf8ToBytes(msgString)));
}

class WalletAccount {
    //#_privateKey ;
    #_nonce ;

    constructor(_accountName=Math.random().toString(36).substr(2, 10), _generateBalance=false){
        //_accountName => the default value is a random set of 10 characters (from 0 to z)
        if(_accountName === ""){
          //console.log("[ACCOUNT] - Empty string")
          this.name=Math.random().toString(36).substr(2, 10);
        }else{
          this.name=_accountName
        }
        //Create the elements of the account
        //*** Private Key */
        this._privateKey = secp256k1.utils.randomPrivateKey();
        //console.log(`[WalletAccount::constructor][Account ${this.name}] Private Key: `, toHex(this.#_privateKey));

        //*** Public Key */
        this.publicKey  = secp256k1.getPublicKey(this._privateKey);
        //console.log(`[WalletAccount::constructor][Account ${this.name}] Public Key:  `, toHex(this.publicKey));

        //*** Address Ethereum-like format */
        this.address = toHex(keccak256(this.publicKey.slice(1)).slice(-20));
        //console.log(`[WalletAccount::constructor][Account ${this.name}] Address: `, this.address);

        //*** Initial nonce */
        this.nonce = 0;
        //this.#_nonce = 0;
        //console.log(`[WalletAccount::constructor][Account ${this.name}] Nonce: `, this.nonce);

        //Normally an account would have a 0 balance to start with but in order to have some fun
        //we assign a random inicial value
        if(_generateBalance){
          this.balance= initialBalance[Math.floor(Math.random() * initialBalance.length)];
          console.log(`[WalletAccount::constructor][Account ${this.name}] Balance: `, this.balance);
        }

        //this.getNonce = this.getNonce
        this.signMessage = this.signMessage

    }    

    signMessage(messageToSign={}){
      //here we sign any message
      /* the Message to sign should have the following format
        messageToSign = {
          nonce:  ==> the nonce of the signer
          to:     ==> the recipient
          value:  ==> the amount to send
        }
      from is not need since it should be the one signing
      */
      if(messageToSign['nonce'] === this.nonce){
        const hashMessage = getHashHex(JSON.stringify(messageToSign));
        console.log(`[AccountWallet::signMessage][Account ${this.name}] Message Hash: `, hashMessage)

        const signature = secp256k1.sign(hashMessage,this._privateKey);
        console.log(`[AccountWallet::signMessage][Account ${this.name}] Signature: `, signature)

        this.nonce += 1 ; //we increase the nonce for the next operation
        //this.#_nonce += 1;
        
        try {
          console.log(`[AccountWallet::signMessage][Account ${this.name}] Signature CompactHex: `, signature.toCompactHex())
          console.log(`[AccountWallet::signMessage][Account ${this.name}] Signature Recovery: `, signature.recovery)

          return [signature.toCompactHex(), signature.recovery];
        } catch (error) {
          console.log(`[WalletAccount::signMessage][Account ${this.name}] ERROR:UNKNOW `);
          console.log('[WalletAccount::signMessage]' , error);
          return ["",-1]
        }
      }else{
        console.log(`[WalletAccount::signMessage][Account ${this.name}] ERROR: Nonce mismatch `);
        console.log('[WalletAccount::signMessage] ', this.nonce, messageToSign['nonce']);
        return ["",-1]
      }
    }

    //get getNonce(){
    //  console.log("Get NONCE Account")
    //  return this.#_nonce;
    //}
    
}

export default WalletAccount ;
