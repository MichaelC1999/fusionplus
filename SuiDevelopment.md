- sui start --with-faucet --force-regenesis
- sui client new-env --alias local --rpc http://127.0.0.1:9000
- sui client switch --env local
- sui client faucet
- sui client gas
- sui client publish --gas-budget 100000000 --skip-dependency-verification

Minting Test Coins (To be swapped)

```
sui client call \
  --function mint \
  --module my_coin \
  --package <PACKAGE_ID> \
  --args <TREASURY_CAP_OBJECT_ID> <AMOUNT> <RECIPIENT_ADDRESS> \
  --gas-budget 100000000
```

Getting the Test Coin Balance and state of a shared object (such as an escrow object)

```
sui client object 0xf61f419c7f9575ef65eb3a91f44023747c1b31fb4d3dd53eba20a291b7b743a4   --json
```

Existing resolver example:

https://github.com/1inch/cross-chain-resolver-example/blob/master/tests/config.ts

Intent Structure + Resolver action example:

https://github.com/1inch/limit-order-protocol/blob/master/description.md

NEXT STEPS:

1. Write segmented functions

- EVM => Sui
- - sign intent EVM
- - deposit_dst
- - withdraw
- - practice cancel
- Sui => EVM
- - sign intent Sui
- - deposit_src
- - withdraw
- - practice cancel

2. Write a relayer

- Simple REST API
- Route for broadcasting EVM => Sui to resolvers
- Route for broadcasting Sui => EVM to resolvers
- Monitor for escrow creation
  - Check EVM factory contract for new deployments with event matching order hash
  - Check Sui module for new objects matching order hash
  - Validate the escrow details
  - Broadcast secret to resolvers

3. Write resolvers

- Write an API
- Route for receiving EVM => Sui broadcasts (condition to accept based on price curve)
- Route for receiving Sui => EVM broadcasts (condition to accept based on price curve)
- Route for receiving the secret after

4. UI

5. Add Zk to relayer

6. Aptos support on contracts + relayer + resolvers

ZK IDEAS

- Ethereum => Sui transfers by recipient email
  -- This allows Inch swaps to be sent to a recipient who is not even onboarded yet, where their assets are claimable based on a post-generation of the wallet
- Relayer with offchain storage of intents, zk proofs to confirm the integrity of daa conversions and intents between data types and signature schemes

Remaining Fusion+ Questions:

- Where/when does the secret get passed
- Does the intent signature get passed the destination chain?
- Which functions does the resolver actually call?
-

HACKATHON GOALS
Around 15 mins https://www.youtube.com/watch?v=EnHov0tCalU
