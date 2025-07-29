const { SuiClient } = require("@mysten/sui.js/client");
const { TransactionBlock } = require("@mysten/sui.js/transactions");
const { Secp256r1Keypair } = require("@mysten/sui.js/keypairs/secp256r1");
const { decodeSuiPrivateKey } = require("@mysten/sui.js/cryptography");
const { zeroAddress, keccak256, toHex, stringToHex, zeroHash } = require("viem");
const { privateKeyToAccount, signTypedData } = require("viem/accounts");
const { normalizeSuiAddress, toHEX } = require("@mysten/sui.js/utils");

   require('dotenv').config();


// -------------------- Shared Setup --------------------
const SUI_RPC = 'http://127.0.0.1:9000';
const ESCROW_PACKAGE_ID = '0x89308ca010496bfa84a5cb4ce50929767ebe837ccc9717e70dcca266b0063101';
const TREASURYCAP_OBJECT_ID = "0xc80c5c77a80334c04ae9364c5e2a4b3c529689217e22a099659ecbed5e06ff92"
const CLOCK_ID = '0x6';
const MY_COIN_PACKAGE_ID = '0xe78b85e04ed63757b1f69a7e62504ddc91cf4d1c9289364ca293de3df0e1b56c'
const MY_COIN_MODULE = '::my_coin::MY_COIN';

const ETHEREUM_ASSET_ADDRESS = "0xc2b2febab8f32732b4fad4b2d7f9f0f2bda3e2d11daa55dedfd98f2bccf75f8d"



const client = new SuiClient({ url: SUI_RPC });

function decodeKeypair(bech32priv) {
  const { secretKey } = decodeSuiPrivateKey(bech32priv);
  console.log(secretKey)
  return Secp256r1Keypair.fromSecretKey(secretKey);
}

function toBytesVec(hexOrBytes) {
  return Array.from(
    typeof hexOrBytes === 'string'
      ? new Uint8Array(Buffer.from(hexOrBytes.slice(2), 'hex'))
      : hexOrBytes
  );
}

/**
 * Encode a 32-byte padded Ethereum-style value
 */
function pad32Bytes(value, type = 'u256') {
  if (typeof value === 'string' && value.startsWith('0x')) {
    value = BigInt(value);
  }
  if (typeof value === 'bigint') {
    const hex = value.toString(16).padStart(64, '0');
    return Uint8Array.from(Buffer.from(hex, 'hex'));
  }
  throw new Error(`Unsupported value for pad32Bytes: ${value}`);
}

/**
 * ABI-style address (left-padded to 32 bytes)
 */
function encodeAddress32(address) {
  const normalized = normalizeSuiAddress(address).replace(/^0x/, '').padStart(64, '0');
  return Uint8Array.from(Buffer.from(normalized, 'hex'));
}

// -------------------- EVM => Sui --------------------

async function signIntentEvm(intent, signer) {
  // TODO: generate intent structure and sign with Ethereum key
// Order struct definition from LimitOrderProtocol
const OrderTypes = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'bytes32' },
    { name: 'receiver', type: 'bytes32' },
    { name: 'makerAsset', type: 'bytes32' },
    { name: 'takerAsset', type: 'bytes32' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'takingAmount', type: 'uint256' },
    { name: 'makerTraits', type: 'uint256' },
  ],
};

const DOMAIN = {
  name: '1inch Limit Order Protocol',
  version: '4',
  chainId: 11155111, // e.g. Sepolia
  verifyingContract: zeroAddress, // replace with real deployed contract
};

console.log(intent)

    const signature = await signer.signTypedData({
    domain: DOMAIN,
    types: OrderTypes,
    primaryType: 'Order',
    message: intent,
  });
  console.log('EVM SIGNATURE:', signature)

  // const orderHash = hashTypedData({
  //   domain: DOMAIN,
  //   types: OrderTypes,
  //   primaryType: 'Order',
  //   message: intent,
  // });

  return signature
}

async function depositDst({ sender, secretHash, escrowAmount, safetyDepositAmount, recipient, coinId, resolverKeypair}) {
  const txb = new TransactionBlock();

  const secretHashVec = toBytesVec(secretHash);
  const merkleRootVec = []; // for now

  const suiCoins = await client.getCoins({ owner: sender, coinType: '0x2::sui::SUI' });
  const escrowCoins = await client.getCoins({ owner: sender, coinType: MY_COIN_PACKAGE_ID + MY_COIN_MODULE });

  if (!suiCoins.data.length || !escrowCoins.data.length) throw new Error('Insufficient coins');

  const safetyDepositCoin = txb.splitCoins(txb.object(suiCoins.data[0].coinObjectId), [txb.pure.u64(safetyDepositAmount)]);
  const escrowCoin = txb.splitCoins(txb.object(escrowCoins.data[0].coinObjectId), [txb.pure.u64(escrowAmount)]);

  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::deposit_dst`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE],
    arguments: [
      txb.pure(secretHashVec),
      safetyDepositCoin,
      txb.pure(recipient),
      txb.pure(merkleRootVec),
      escrowCoin,
      txb.object(CLOCK_ID),
    ]
  });

  txb.setGasBudget(100000000);
    const result = await client.signAndExecuteTransactionBlock({ transactionBlock: txb, signer: resolverKeypair, options: {
      showEffects: true,
      showObjectChanges: true
    } });
        console.log(JSON.stringify(result))
    return result.effects.created[0]?.reference?.objectId || zeroHash // The Escrow created
}

async function cancel({ escrowObjectId, keypair}) {
  const txb = new TransactionBlock();


    txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::cancel`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE ], // e.g., "0x123::my_coin::MY_COIN"
    arguments: [
      txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
      txb.object(CLOCK_ID)       // Clock object reference
    ]
    
  });

  txb.setGasBudget(100000000);
    const result = await client.signAndExecuteTransactionBlock({ transactionBlock: txb, signer: keypair, options: {
      showEffects: true,
      showObjectChanges: true
    } });
        console.log(JSON.stringify(result))
    return zeroHash // The Escrow created

//   public entry fun cancel<T>(
//     escrow: Escrow<T>,  // Takes ownership of the escrow object
//     clock: &Clock,
//     ctx: &mut TxContext
// ) {
  // TODO: cancel if expiry reached
}

// -------------------- Sui => EVM --------------------

async function signIntentSui(intent, keypair) {
  const {
    salt,
    maker,
    receiver,
    maker_asset,
    taker_asset,
    making_amount,
    taking_amount,
    maker_traits,
  } = intent;

  // Concatenate all fields in order using 32-byte ABI-style encoding
  const encoded = new Uint8Array([
    ...pad32Bytes(salt),
    ...encodeAddress32(maker),
    ...encodeAddress32(receiver),
    ...encodeAddress32(maker_asset),
    ...encodeAddress32(taker_asset),
    ...pad32Bytes(making_amount),
    ...pad32Bytes(taking_amount),
    ...pad32Bytes(maker_traits),
  ]);

  
  // Sign the raw bytes using Sui keypair
  const signature = await keypair.sign(encoded);

return toHex(signature);
}

async function depositSrc({ sender, secretHash, escrowAmount, safetyDepositAmount, recipient, keypair }) {
  
  const txb = new TransactionBlock();

  const secretHashVec = toBytesVec(secretHash);
  const merkleRootVec = []; // for now
  const suiCoins = await client.getCoins({ owner: sender, coinType: '0x2::sui::SUI' });
  const escrowCoins = await client.getCoins({ owner: sender, coinType: MY_COIN_PACKAGE_ID + MY_COIN_MODULE });
  console.log(sender, suiCoins)
  if (!suiCoins.data.length) throw new Error('Insufficient SUI coins');
  if (!escrowCoins.data.length) throw new Error('Insufficient MY_COINS')

  const safetyDepositCoin = txb.splitCoins(txb.object(suiCoins.data[0].coinObjectId), [txb.pure.u64(safetyDepositAmount)]);
  const escrowCoin = txb.splitCoins(txb.object(escrowCoins.data[0].coinObjectId), [txb.pure.u64(escrowAmount)]);

  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::deposit_src`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE],
    arguments: [
      txb.pure(secretHashVec),
      safetyDepositCoin,
      txb.pure(merkleRootVec),
      escrowCoin,
      txb.object(CLOCK_ID),
    ]
  });


  txb.setGasBudget(100000000);
  // const { bytes, signature } = await keypair.signTransactionBlock({ transactionBlock: txb });
  // const result = await client.executeTransactionBlock({ transactionBlock: bytes, signature: [signature] });

  // txb.setSponsor

  // console.log('DepositSrc result:', bytes, signature);
  // return {bytes, signature}

    const result = await client.signAndExecuteTransactionBlock({ transactionBlock: txb, signer: keypair, options: {
      showEffects: true,
      showObjectChanges: true
    } });
        console.log(JSON.stringify(result))
    return result.effects.created[0]?.reference?.objectId || zeroHash // The Escrow created

}

async function withdraw({escrowObjectId, secret, keypair}) {


  const txb = new TransactionBlock();

  // Convert secret to vector<u8> format
  const secretVec = toBytesVec(secret);
  console.log(escrowObjectId, secret, secretVec)
  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::withdraw`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE ], // e.g., "0x123::my_coin::MY_COIN"
    arguments: [
      txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
      txb.pure(secretVec),       // secret as vector<u8>
      txb.object(CLOCK_ID)       // Clock object reference
    ]
  });

  // Set the sender and gas payment
  // txb.setSender(keypair.getPublicKey().toSuiAddress());
  // txb.setGasPayment() - optional if you want specific gas coins
  txb.setGasBudget(100000000);

  // Sign and execute transaction
  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    signer: keypair,
    options: {
      showEffects: true,
      showObjectChanges: true
    }
  });
  console.log(result)

  return result;

}

async function cancelSrc() {
  // TODO: cancel if expiry reached
}

// -------------------- Testing Sequence -----------------------
async function mainExecution() {
  console.log(process.env.MAKER_SUI_PK)
  const makerKeypair = decodeKeypair(process.env.MAKER_SUI_PK)
  const resolverKeypair = decodeKeypair(process.env.RESOLVER_SUI_PK)

  
  const makerSigner = privateKeyToAccount(process.env.MAKER_EVM_PK)
  const resolverSigner = privateKeyToAccount(process.env.RESOLVER_EVM_PK)
  
  console.log(makerKeypair.toSuiAddress(), resolverKeypair.toSuiAddress(), 'guf')
  

  //SUI => EVM
  
  
  // const suiIntent = await signIntentSui({
  //   salt: 123n,
  //   maker: makerKeypair.toSuiAddress(),
  //   receiver: resolverSigner.address, // EVM address of the maker. The destination version of the intent signer
  //   maker_asset: MY_COIN_PACKAGE_ID, // The equivalent of the address of the token. The resolver script handles mapping the address to the module suffix 
  //   taker_asset: ETHEREUM_ASSET_ADDRESS,
  //   making_amount: 10_000000n,
  //   taking_amount: 10_000000n,
  //   maker_traits: 0n,
  // }, makerKeypair);
  
  // // IMPORTANT - FOR NOW, THE RESOLVER SENDS COINS TO THE ESCROW. NEED TO FIX SPONSOR TXs
  // const suiToEvmEscrowId = await depositSrc({
  //   sender: resolverKeypair.toSuiAddress(),
  //   secretHash: keccak256(stringToHex("TestSecret")),
  //   escrowAmount: 10_000000n,
  //   safetyDepositAmount: 0n,
  //   recipient: resolverKeypair.toSuiAddress(),
  //   keypair: resolverKeypair 
  // })

  // console.log(suiToEvmEscrowId)

  //CHECK THE NEW ESCROW OBJECT BALANCE

  // await withdraw({escrowObjectId: "0x7c60e070dd8634bb2ce691b1626e7d31e64ddc29e131185a9fa1c483876f08b8", secret: stringToHex("TestSecret"), keypair: resolverKeypair })






  //EVM => SUI
  // const evmIntent = await signIntentEvm({
  //   salt: 123n,
  //   maker: toHex(pad32Bytes(makerSigner.address)),
  //   receiver: makerKeypair.toSuiAddress(), // EVM address of the maker. The destination version of the intent signer
  //   makerAsset: MY_COIN_PACKAGE_ID, // The equivalent of the address of the token. The resolver script handles mapping the address to the module suffix 
  //   takerAsset: toHex(pad32Bytes(ETHEREUM_ASSET_ADDRESS)),
  //   makingAmount: 10_000000n,
  //   takingAmount: 10_000000n,
  //   makerTraits: 0n,
  // }, makerSigner);


  // const evmToSuiEscrowId = await depositDst({
  //   sender: resolverKeypair.toSuiAddress(),
  //   secretHash: keccak256(stringToHex("TestSecret")),
  //   escrowAmount: 10_000000n,
  //   safetyDepositAmount: 20000n,
  //   recipient: makerKeypair.toSuiAddress(),
  //   resolverKeypair: resolverKeypair 
  // })

  // console.log(evmToSuiEscrowId)

  //CHECK THE NEW ESCROW OBJECT BALANCE

  // await withdraw({escrowObjectId: "0x2ad6652a34dc83a09cae2b9f24efeb7668d26d3c2222e191639be0b7b9f62f95", secret: stringToHex("TestSecret"), keypair: resolverKeypair })

  await cancel({escrowObjectId: "0x461eb3e60a4728bbfb6798ed455bf2f6a520a4d5e26987b1e73f8240c4bfdb99", keypair: resolverKeypair})

}

mainExecution()


// -------------------- Exported For Testing --------------------
module.exports = {
  signIntentEvm,
  depositDst,
  signIntentSui,
  depositSrc,
  withdraw,
  cancel,
};
