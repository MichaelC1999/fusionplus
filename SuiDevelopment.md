- sui start --with-faucet --force-regenesis
- sui client new-env --alias local --rpc http://127.0.0.1:9000
- sui client switch --env local
- sui client faucet
- sui client gas
- sui client publish --gas-budget 100000000 --skip-dependency-verification

Minting Test Coins for Sui to EVM swaps

```
sui client call \
  --function mint \
  --module my_coin \
  --package 0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2 \
  --args 0xaa7990dba3409f754309638de00ce07a35148981f136601f20b98940067a3871 <AMOUNT> <RECIPIENT_ADDRESS> \
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

COMPLETED

2. UI and initiaization

- Scaffold a dual SUI + EVM wallet supported front end
- Inputs for amounts, choose direction
- Deploy the testnet Sui contracts
- Deploy EVM ready contracts
  Deployer address: 0xD6F5A6E178B5CC4DC50e5CAeeB04C3EBf5fa32FF
  ✅ EscrowFactory deployed to: 0x1AfB4549EF881c925680874109A58b8133e97BBE
  ✅ Resolver deployed to: 0xB5f7Db400124Ca4f6812f4F465eb2ef3A0bE88bc

3. Write a relayer

- Simple REST API
- Route for broadcasting EVM => Sui to resolvers
- Route for broadcasting Sui => EVM to resolvers
- Monitor for escrow creation
  - Check EVM factory contract for new deployments with event matching order hash
  - Check Sui module for new objects matching order hash
  - Validate the escrow details
  - Broadcast secret to resolvers

4. Write resolvers (Can be same API backend as the relayer)

- Write an API
- Route for receiving EVM => Sui broadcasts (condition to accept based on price curve)
- Route for receiving Sui => EVM broadcasts (condition to accept based on price curve)
- Route for receiving the secret after

5. Add Zk to relayer

- Maker FE to Relayer ZK proofs to prove that the relayer served the correct data from the signature

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
