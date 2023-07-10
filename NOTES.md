# Notes regarding this solution to the Alchemy Excercise

## 1. About my DEV environment
I'm using [code-server](https://github.com/coder/code-server) in a Raspberry Pi to have the VSCode IDE on the browser. Because of that, all is executed remotely and so some changes on the initial setup were required:
 + On file [server.js](./client/src/utils/server.js) the baseURL change from localhost to my Raspberry Pi IP. Vite uses dotenv to use env variables. [Here](https://vitejs.dev/guide/env-and-mode.html) you can find the documentation. The full URL is defined in the .env file as VITE_BASE_URL.

 + On file [package.json](./client/package.json) I added in the script section `"host": "vite --host"`.
 This exposes the server to access on all ethernet interfaces and thus allow remote access to test the front-end part. So instead of running `npm run dev` to start the application, I used `npm run host` 

## 2. Description of the solution
> Note: below, the use of account and wallet  is interchangeable. 

The solution is composed of 3 parts:
 + the **WalletAccount** class the generates the public and privates keys and signs the messages
 + the **client** is where the interaction between the user and accounts is done.
 + the **server** is where the balances of each account.

The account information (name, address, keys) is managed in the client-side. (simulating somehow how a web3 wallet as MetaMask is used)

The balances and controls on transfer are done on the server-side. The server would be acting as the "blockchain". if a difference on balances on an account between client side and server side happens, the balance on the server is the one that is important and taken as true.

For any transfer between accounts, the operation must be signed on the client and validated on the server to be considered as valid.

### 2.1 WalletAccount class
The purpose of the class is to abstract the creation process of an account. Also providing with a **signMessage** function it "prevents" the direct access or use of the private key, keep it... private.

WalletAccount has 3 functions: 
 + the <u>constructor</u> that will generate automatically:
    + a pair of **private** and **public** keys
    + an **address** of 20-bytes similar in its construction as it is used in Ethereum.

 + the <u>signMessage</u>. it returns the hex of the signature produced by `Signature.toCompactHex` and the recovery byte of the signature.

 + the <u>getNonce</u>. It returns the current value of the nonce. The nonce is this case represents the count of messages signed. It should not be modified outside the class.

The class also has 2 additional features, not essential for it to work:
 + a <u>name</u> for the account: this can be passed to the constructor or it will be automatically generated to 10 random characters. 
 + a <u>balance</u>. Upon creation, one can choose to have a random balance to be assigned (useful for testing purposes). The balance of an account is managed on the server, so on the client side it is only useful as reference. 


### 2.2 Client operations
The UI was redesigned in order to avoid hardcoded accounts.

#### <u>Wallet section</u>
This section is composed of 2 parts:
 - the **<u>CREATE</u>** account: pressing the button CREATE will create a new instance of the walletAccount class. Optionnally a name can be provided
   
  ![](./client/images/ECDSA%20Node_Wallet_Create.png)

  Upon the creation on the client side (that generates the private/public keys and its address) a request to the server is dispatch to create it as well and retreive its balance.
    > Note that in a normal use case, the initial balance would be 0 (zero). Since this is for testing purpses, a randm balance among predefined balances is assigned to the account on the server.

    If a named account already exists, then the creation is not done. The name of the account is unique.

    Once the creation is confirmed, the account will be displayed in the ACCOUNT LIST

 - the **<u>ACCOUNT LIST</u>**: Here all available accounts on the client side are displayed.
 This makes easy to see the "public" information of the avaiable accounts.

    ![](./client/images/ECDSA%20Node_Wallet_List.png)
  
#### <u>Transfer section</u>
On this panel, the transfer of funds between accounts is generated.
As soon as an account is created on the Wallet pane, it is available on the list of **sender** and **signer** accounts.

![](./client/images/ECDSA%20Node_Transfer.png)

This panel is composed of 4 parts:
- the <u>sender account</u>: the account that would be "sending" funds to the recipient
- the <u>signer account</u>: the account that would be signing the transaction
- the <u>amount</u> to send: the amount to be sent from the sender account to the destination address
- the <u>destination address</u>: the destination address. 

These are the rules or contraints that are followed here:
+ The sender and signer accounts can only be selected from existing accounts
+ If the sender account has a balance of 0 (zero), the Transfer won't be executed
    For this, the current balance can be seen on the Account list in the Wallet pane or in the dropdown.
    The balance shown on the UI represents the last received balance from the server. Before executing the transfer a query on the actual balance is executed and depending on that balance is the decision made.
+ The amount to be sent to the destination account cannot be negative nor exceed the actual balance of the sender account.
+ The list of sender and signer account shows the name and balance but on the execution to the server the corresponding address is sent instead. The name of the account is just a easy to remember shortcut.
+ the destination address must be an address (there is no control on its format and it will be considered an address).
    The address might not be known on the system (client or server). If not known on the server, it will be created with the initial balance equal to the transferred funds.
    The "new" address won't be added in the client side as the account itself cannot be generated. If by chance a new account happens to have the same address as that unknown destination address (chances for this are very low), then the balance recorded on the server will be retreived.
+ if the sender account and signer account are the same, the transaction should succeed.
+ if the sender account and signer account are different, the transaction should fail

### 2.3 Server operations

The server exposes 3 functionnalities:

- /balance/:address [GET]  
    + **<u>Required input</u>**: address of the account
    + **<u>Returned value</u>**: balance of the account

    allows to check the balance of an account. If the address requested is not known the returned balance would be zero.
    
- /createAccount [POST] allows to create a new account.
    + **<u>Required input</u>**: address of the account
    + **<u>Returned value</u>**: balance of the account

     The require parameter is an address. If the address is already in use/known, no creation nor reset is done and the actual balance is returned. If the address is a new one, then an initial balance is set and then returned.
    > Note that in a normal use case, the initial balance would be 0 (zero). Since this is for testing purpses, a randm balance among predefined balances is assigned to the account on the server.


- /send [POST] allows to transfer an amount from one account to another.
    + **<u>Required input</u>**: 
        - message JSON
        - sender address
        - sender public key
        - signature of the message 
        - recovery bit
    + **<u>Returned value</u>**: 
        - result of the transaction (sucess/fail)
        - JSON with the balance of the sender address and destination address 

The MESSAGE should be formatted with the following elements:
- "to": which correspond to the address of the destination account
- "value": the amount to send from the sender to the recipient
- "nonce": an indicator of the signature count. 

The SIGNATURE is the signature HEX retreived from the `Signature.toCompactHex` and contains the components r and v. Along with the RECOVERY BIT, the signature object can be rebuilt.

The resulting SIGNATURE object is then used with the public key received and the hash of the MESSAGE to verify that the sender indeed signed the message.

These are the rules or contraints that are followed here:
- all elements in parameters should be present
- the signature should be valid and need to correspond to the message sent and the sender public key (result from `secp256k1.verify` used)
- the sender address should have enough balance (sender.balance >= amount to send)
- if the destination address is not known, a new entry is created and then the amount is added to the balance

### 2.4 Errors
An additinal panel was added to present all errors that might appear during the operatioons.
