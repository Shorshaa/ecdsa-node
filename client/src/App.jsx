import Wallet from "./components/Wallet";
import Transfer from "./components/Transfer";
import Error from "./components/Error"
import "./App.scss";
import { WalletDataContextProvider  } from './context/walletDataContext'

function App() {

  return (
    <div className="app">
      <WalletDataContextProvider>
        <Wallet />   
        <Transfer />
        <Error />
      </WalletDataContextProvider>
    </div>
  );
}

export default App;
