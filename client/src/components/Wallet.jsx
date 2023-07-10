import server from "../utils/server";

import { useState, useContext } from "react";
import WalletAccount  from '../utils/walletAccount'
import { WalletDataContext } from '../context/walletDataContext'


//function Wallet({ address, setAddress, balance, setBalance, accountName, setAccountName }) {
function Wallet() {
  const { accountList, setAccountList, accountNameList, setAccountNameList, setHasError, setErrorMessage } = useContext(WalletDataContext);
  const [ newAccount, setNewAccount ] = useState("");
  
  const createNewAccount = (evt) => {
    //First create locally the account (to get public/private keys)
    //second send the create account to the server and assign balance
    //third: if all is correct, create account.else ERROR
    
    //console.log("ON SUBMIT > ", newAccount, accountNameList)
    evt.preventDefault();

    console.log("[Wallet::onCreateNewAccount]  value: [", newAccount,"]")
    
    //we create an account
    //We need to check whether the name is already known ==> no duplicates
    //If the field is blank, a random name is created so we don't need to check that one
    //then we create it. 
    setErrorMessage("")
    setHasError(false)

    if(accountNameList[newAccount]){
      console.log("[Wallet::onCreateNewAccount] account known", newAccount );
      setErrorMessage("[Wallet::onCreateNewAccount] account known - " + newAccount )
      setHasError(true)
    }else{
      console.log("[Wallet::onCreateNewAccount] New Account requested");
      try {
        let _newAcc = new WalletAccount(newAccount);
        const _address = _newAcc.address;

        //Now we request the creation on the server to get back the balance
        //If there is an error, we can't complete the creation
        try {
          //console.log("[Wallet::onCreateNewAccount] requesting creation on server for ", _address);
          server.post("/createAccount",{address: _address})
          .then(response => {
            //console.log("[Wallet::onCreateNewAccount] RESPONSE from server:",response.data.balance);
            _newAcc.balance = response.data.balance;
            //console.log("[Wallet::onCreateNewAccount] >> Balance on Account updated from server : ", _newAcc.balance);

            try {
              //setAccountList([...accountList, _newAcc]);  //didn't work 
              const _tempAccList = [...accountList, _newAcc];
              setAccountList(_tempAccList);
              setAccountNameList([...accountNameList, `${_newAcc.name}`]);  

            } catch (error) {
              console.log("[Wallet::onCreateNewAccount] ERROR while adding the account. ", error)
              setErrorMessage("[Wallet::onCreateNewAccount] ERROR while adding the account." )
              setHasError(true)
            }
          })
        } catch (error) {
          console.log("[Wallet::onCreateNewAccount] ERROR Connection to server. ", error);
          setErrorMessage("[Wallet::onCreateNewAccount] ERROR Connection to server. " )
          setHasError(true)
        }

        console.log("[Wallet::onCreateNewAccount] account created: ", _newAcc.name, _newAcc.balance, _newAcc);
        //console.log("[Wallet::onCreateNewAccount]Total number of accounts > ", accountList.length, Object.keys(accountNameList).length);
        
      } catch (error) {
        console.log("[Wallet::onCreateNewAccount] ERROR:", error);
        setErrorMessage("[Wallet::onCreateNewAccount] ERROR. " )
        setHasError(true)
         
      }

      //Reset the form
      document.getElementById("create-wallet-form").reset();
      setNewAccount("");
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>
      
      <form id="create-wallet-form" className="createAccount" onSubmit={createNewAccount}>
          <h2> Create new Account </h2>
          <input id="accountNameField" type="text" placeholder="Name" onChange={e=>{setNewAccount(e.target.value);}} />
          <button className="button" > CREATE </button>
      </form>
      
      <hr />

      <h2> Available accounts and balances</h2>
      <div className="table-wrapper">
        <div className="table-scroll">
          <table > 
            <thead>
              <tr>
                <th><span><b> Account Name </b></span></th>
                <th><span><b> Address </b></span></th>
                <th><span><b> Balance </b></span></th>
                <th><span><b> Nonce </b></span></th>
              </tr>
            </thead>
            <tbody>
              {accountList?.map((_account, key)=>{
                return (
                  <tr key={key}>
                    <td>{_account.name}</td>
                    <td>{_account.address}</td>
                    <td>{_account.balance}</td>
                    <td>{_account.nonce}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
