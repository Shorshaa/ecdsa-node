import { useContext } from "react";
import { WalletDataContext } from '../context/walletDataContext'

function Error () {
    const { hasError, errorMessage } = useContext(WalletDataContext);

    return (
        <div className="errorContainer error">
             {hasError && <p> {errorMessage} </p> }
        </div>
    )
}

export default Error;