**SuiEqui** is an extension of the 1inch Fusion+ atomic swap protocol for swaps between EVM chains and Sui. This involved developing new Move-based Sui smart contracts to handle escrow creation and transfer functionality, adhering to the hashlock and timelock patterns and the order of execution that Fusion+ implementations follow.

### Sui Move Smart Contracts

View the smart contracts in the '/sources' directory.

A Move module implementing escrow functionality using Sui’s object model. Each swap is represented by a new on-chain object.

- Locks a token using a `secret_hash`
- Enforces `expiry_timestamp` as a timelock
- Stores a separate `Coin<SUI>` as a **safety deposit**
- Verifies and releases tokens on secret revelation
- Supports refund after expiry via `cancel()`

#### Escrow Object Isolation

Each call to deposit_src or deposit_dst creates a new Escrow<T> object via object::new(ctx) and stores it using transfer::share_object. This ensures:

Escrows are independent and traceable

Funds and safety deposits are locked on a per-swap basis

Merkle-based secrets and fill tracking are encapsulated per object

#### Gas Sponsorship

To enable gasless swaps for makers:

The maker signs the order off-chain

The relayer (resolver) submits the transaction and pays for gas

The contract reads both the depositor address (maker) and tx_context::sponsor() (resolver)

The resolver receives the safety deposit for executing or canceling the swap

## Demo Environment

### Run Relayer

Relayer and resolver are located in the /relayer directory. .env already contains the necessary private keys for fulfillment (testnet only)

```

cd relayer
npm install --f
npm run dev
```

### Run the UI

This UI exists to show the functionality of swaps between Sui and Sepolia. Feel free to connect your walletys and test this functionality. See the other sections to get test tokens

```
cd swap-ui
npm install --f
npm run dev
```

### Testing

As stated in the relayer section, the pks are already initiated for resolver fulfimment, with test token balances prepared. To initiate a swap from your wallet, you need Sepolia Aave USDT (https://gho.aave.com/faucet/) or Sui USDT from my own deployment. Once you get Sui testnet gas, execute the following in your sui cli

```

sui client call \
  --function mint \
  --module my_coin \
  --package 0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2 \
  --args 0xaa7990dba3409f754309638de00ce07a35148981f136601f20b98940067a3871 <AMOUNT> <RECIPIENT_ADDRESS> \
  --gas-budget 100000000
```
