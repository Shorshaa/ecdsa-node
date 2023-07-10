import { createContext, useState } from 'react';

const WalletDataContext = createContext();

const WalletDataContextProvider = ({ children }) => {
    const [accountList, setAccountList] = useState([]);
    const [accountNameList, setAccountNameList] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(false);

    const updAccountBalance = (accAddress, accNewBalance) => {
      console.log("[WalletContext::updAccountBalance]", accAddress, accNewBalance)
      setAccountList(
        accountList.map((element)=>{
          if(element.address === accAddress){
            //we can't use the spread here as the class methods would be lost
            //Ref >> https://stackoverflow.com/questions/58058559/why-can-i-not-use-the-spread-operator-on-a-class-function
            element.balance = accNewBalance
            //return {...element, balance: accNewBalance}
            return element
          }else{
            return element
          }
        })
      )
    }

    const getAccount = (address) => {
      return accountList.find((element) => element.address === address)
    }

    const value = { accountList, setAccountList, accountNameList, setAccountNameList, 
                    hasError, setHasError, updAccountBalance, getAccount, 
                    errorMessage, setErrorMessage };

    return (
      <WalletDataContext.Provider value={value}>
        {children}
      </WalletDataContext.Provider>
    );
  };

export {WalletDataContext, WalletDataContextProvider};