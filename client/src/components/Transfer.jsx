import { useState, useContext, useEffect } from "react";
import server from "../utils/server";
import { WalletDataContext } from '../context/walletDataContext'

const toHexString = (bytes) => {
  return Array.from(bytes, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
};

function Transfer({ address, setBalance }) {
  /*To send funds from one account to another, we need:
      - a source account (the one that says to send the amount)
      - a signer account (the one that signs the operation)
      - a recipient account (the one that receives the amount)
      - an amount
  */
  const { accountList, setHasError, updAccountBalance, getAccount, setErrorMessage } = useContext(WalletDataContext);

  const [sendAmount, setSendAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  
  //Addresses
  const [recipient, setRecipient] = useState("");
  const [signer, setSigner] = useState("");
  const [sender, setSender] = useState("");
   
  //Message to send and sign
  const [message, setMessage] = useState({ to:"", value:0, nonce:0 });
  const [senderOptions, setSenderOptions] = useState("");   
  const [signerOptions, setSignerOptions] = useState("");   

  //single function to handle the update of the states.
  const setValue = (setter) => (evt) => setter(evt.target.value);

  //The actual transfer execution
  const onTransferExecution = async (evt) => {
    //Called from pressing the button
    //console.log("[TRANSFER::onTransferExecution] Init");
    evt.preventDefault();

    //First check that all required information is properly set
    //console.log("[TRANSFER::onTransferExecution] Sender > ", sender)
    //console.log("[TRANSFER::onTransferExecution] Signer > ", signer)
    //console.log("[TRANSFER::onTransferExecution] Recipient > ", recipient)
    //console.log("[TRANSFER::onTransferExecution] Value > ", sendAmount)

    if( sender !== "" && signer !== "" && !isNaN(sendAmount) && parseInt(sendAmount) > 0 && recipient !== ""){
      //check that the sender has enough funds
      //For that we try to get the updated information from server, else we fallback to the information on the client
      //The actual control will be help on server-side upon execution of the transfer
      const senderAccount = getAccount(sender);
      const signerAccount = getAccount(signer);
      //console.log("[TRANSFER::onTransferExecution] Sender Account > ", senderAccount);
      //console.log("[TRANSFER::onTransferExecution] Signer Account > ", signerAccount);

      try {
        const response = await server.get(`balance/${senderAccount.address}`);
        //console.log("[TRANSFER::onTransferExecution] Response back from server [query of balance]: ", response);
        updAccountBalance(senderAccount.address,response.data.balance) //this updates the global list
        senderAccount.balance = response.data.balance;
      } catch (error) {
        console.log("[TRANSFER::onTransferExecution] ERROR while getting balance: ", error);
      }
      
      if(senderAccount.balance >= sendAmount){
        try {
          const signatureArray = signerAccount.signMessage(message);
          //console.log("[TRANSFER::onTransferExecution] Signature Array: ", signatureArray)
          const signature = signatureArray[0] 
          const recoveryBit = signatureArray[1] 

          //console.log("[TRANSFER::onTransferExecution] Sign returned: ", signature)
          //console.log("[TRANSFER::onTransferExecution] recovery returned: ", recoveryBit)
          
          if(signature !== ""){
            //we can continue
             setHasError(false)
            //console.log("[TRANSFER::onTransferExecution] Address From: ", senderAccount.address)
            //console.log("[TRANSFER::onTransferExecution] message: ", message)
            //console.log("[TRANSFER::onTransferExecution] signature: ", signature)
            //console.log("[TRANSFER::onTransferExecution] PublicKey: ", senderAccount.publicKey)
            //console.log("[TRANSFER::onTransferExecution] PublicKey: ", toHexString(senderAccount.publicKey));

            try {
              const response = await server.post("/send", { sender: senderAccount.address,
                                    message: message,
                                    signature: signature,
                                    senderPublicKey: toHexString(senderAccount.publicKey),
                                    recovery: parseInt(recoveryBit),
                                  })
            
              //console.log("[TRANSFER::onTransferExecution] Response back from server: [transmission] ", response);
                
              if(response.data.result === "OK"){
                //All good. we update the balances returned
                Object.keys(response.data.balances).map((key) => {
                  updAccountBalance(key, response.data.balances[key])
                })

                //all ended correctly
                setErrorMessage("");
                setHasError(false);
                
              }else{
                //An errror
                console.log("ERROR on return ", response.data.result)
                setErrorMessage("[TRANSFER::onTransferExecution] ERROR on return - " + response.data.result);
                setHasError(true)
              }
              
            } catch(error){
              console.log("[TRANSFER::onTransferExecution] ERROR ON TRANSMISSION", error)
              setErrorMessage("[TRANSFER::onTransferExecution] ERROR ON TRANSMISSION");
              setHasError(true)
            }      

          }else{
            console.log("[TRANSFER::onTransferExecution] ERROR on the signature ");
            setErrorMessage("[TRANSFER::onTransferExecution] ERROR on the signature 1");
            setHasError(true)
            
          }
          
        } catch (error) {
          console.log("ERROR on signature: ", error);
          setErrorMessage("[TRANSFER::onTransferExecution] ERROR on the signature 2");
          setHasError(true)
        }
        

      }else {
        console.log("[TRANSFER::onTransferExecution] NOT ENOUGH FUNDS")
        setErrorMessage("[TRANSFER::onTransferExecution] NOT ENOUGH FUNDS");
        setHasError(true)
      }
    }else{
      if(!isNaN(sendAmount) && parseInt(sendAmount) >= 0){
        console.log("[TRANSFER::onTransferExecution] Amount not set")
        setErrorMessage("[TRANSFER::onTransferExecution] Amount not set");
      }else{
        console.log("[TRANSFER::onTransferExecution] - Can't transmit - some parameters missing")
        setErrorMessage("[TRANSFER::onTransferExecution] - Can't transmit - some parameters missing");
      }
      setHasError(true)

    }
    console.log("[TRANSFER::onTransferExecution] END");
  }

  useEffect(() => {
    setSenderOptions(accountList.map((element,key)=>{
      return <option key={key} value={element.address}>{element.name} (Balance: {element.balance})</option>
    }));

    setSignerOptions(accountList.map((element, key)=>{
      return <option key={key} value={element.address}>{element.name} (Balance: {element.balance})</option>
    }));

    let signerNonce = 0;
    if(signer !== ""){
      signerNonce = getAccount(signer).nonce
    }

    setMessage({...message, "to": recipient, "value": Number(sendAmount), "nonce": signerNonce,});
    
    if(sender!==""){
      setMaxAmount(getAccount(sender).balance|0);
    }
    
  },[accountList, sender, recipient, signer, sendAmount]);

  return (
    <form className="container transfer" onSubmit={onTransferExecution}>
      <h1>Send Transaction</h1>
 
      <label> <b>Sender Address</b>
        <select class="dropdown" onChange={setValue(setSender)}>
          <option value="" >Select an account to send from</option>
          {senderOptions}
        </select>
        <div><b>Sender Address:</b> {sender}</div>
      </label>

      <label> <b> Signer Address </b>
        <select  class="dropdown"  onChange={setValue(setSigner)}>
          <option value="" >Select an account to sign</option>
          {signerOptions}
        </select>
        <div><b>Signer Address:</b> {signer}</div>
      </label>

      <label> <b> Amount </b> (Max allowed: {maxAmount})
        <input placeholder="1, 2, 3..." type="number" min="0" max={maxAmount}
          value={sendAmount} onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label> <b> Recipient </b>
        <input placeholder="Type an address, for example: 0x2"
          value={recipient} onChange={setValue(setRecipient)} 
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
      
    </form>
  );
}

export default Transfer;
