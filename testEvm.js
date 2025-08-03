const { createWalletClient, http, encodeAbiParameters, parseAbiParameters, toHex, pad, hexToBigInt, decodeFunctionData, decodeAbiParameters, recoverAddress, recoverPublicKey, zeroAddress, recoverTypedDataAddress, parseSignature, signatureToCompactSignature } = require( 'viem')
const { privateKeyToAccount } = require( 'viem/accounts')
const { sepolia } = require( 'viem/chains')
const { keccak256, toBytes, hashTypedData } = require( 'viem/utils')
const { randomBytes } = require( 'crypto')
const { trim0x } = require('@1inch/byte-utils')
const { readContract } = require('viem/actions')
   require('dotenv').config();




// Configuration
const MAKER_ADDRESS = '0x1ca2b10c61d0d92f2096209385c6cb33e3691b5e' // Your address
const MAKER_ASSET = '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0' // Source token address
const TAKER_ASSET = '0xda0000d4000015a526378bb6fafc650cea5966f8' // Destination token address
const RESOLVER_ADDRESS = '0x787b77962010c893F2AA37895e2cD73a6F68599e' // Resolver contract address

const PRIVATE_KEY = process.env.PRIVATE_KEY;


const ESCROW_FACTORY_ADDRESS = '0xC903AD0Bfc63D3e0A91E5f7ABE377596fA8E4444' // Replace with EscrowFactory address
const RESOLVER_ABI = [{"type":"constructor","inputs":[{"name":"factory","type":"address","internalType":"contract IEscrowFactory"},{"name":"lop","type":"address","internalType":"contract IOrderMixin"},{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"arbitraryCalls","inputs":[{"name":"targets","type":"address[]","internalType":"address[]"},{"name":"arguments","type":"bytes[]","internalType":"bytes[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"cancel","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deployDst","inputs":[{"name":"dstImmutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"srcCancellationTimestamp","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deploySrc","inputs":[{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"order","type":"tuple","internalType":"struct IOrderMixin.Order","components":[{"name":"salt","type":"uint256","internalType":"uint256"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"receiver","type":"uint256","internalType":"Address"},{"name":"makerAsset","type":"uint256","internalType":"Address"},{"name":"takerAsset","type":"uint256","internalType":"Address"},{"name":"makingAmount","type":"uint256","internalType":"uint256"},{"name":"takingAmount","type":"uint256","internalType":"uint256"},{"name":"makerTraits","type":"uint256","internalType":"MakerTraits"}]},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"vs","type":"bytes32","internalType":"bytes32"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"takerTraits","type":"uint256","internalType":"TakerTraits"},{"name":"args","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdraw","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"secret","type":"bytes32","internalType":"bytes32"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"error","name":"InvalidLength","inputs":[]},{"type":"error","name":"LengthMismatch","inputs":[]},{"type":"error","name":"NativeTokenSendingFailure","inputs":[]},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}]


async function deploySrcManually() {
  try {
    // 1. Setup client and account
    const account = privateKeyToAccount(PRIVATE_KEY)
    console.log(privateKeyToAccount(PRIVATE_KEY))
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http()
    })

    // 2. Generate random values
 const clean = (hex) => hex.replace(/^0x/, '').toLowerCase();

  // Extension is: target address (20 bytes) + callData (arbitrary length)
  const extension = ESCROW_FACTORY_ADDRESS
  const extensionHash = keccak256(toBytes(extension));
    const saltPrefix = BigInt(9n) << 160n;
const extensionHashSuffix = BigInt(extensionHash) & ((1n << 160n) - 1n);
const salt = saltPrefix | extensionHashSuffix;
  // const salt = 123n << 160n // upper 96 bits set to 123, lower 160 bits zero
    const secret = toHex(pad(toBytes("testSecret"), { size: 32 }))
    const hashlock = keccak256(secret)
    
    // 3. Define order parameters
    const makingAmount = '11000000' // Example: 100 tokens
    const takingAmount = '9900000' // Example: 99 tokens
    const safetyDeposit = '100000000' // Example: 0.001 ETH

    // 4. Create order hash (simplified - you may need exact same logic as contract)
    
    
    
    // 6. Create order tuple
    const order = {
      salt,
      maker: MAKER_ADDRESS,
      receiver: zeroAddress,
      makerAsset: MAKER_ASSET,
      takerAsset: TAKER_ASSET,
      makingAmount,
      takingAmount,
      makerTraits: buildMakerTraitsViem({
        allowedSender: '0x000000000000000000000000000000000000000',
        expiry: 0n,
        nonce: 12n,
        series: 5n,
      })
    }
    const ext = (await buildExt(ESCROW_FACTORY_ADDRESS, hashlock))
    order.salt = ext.salt

const DOMAIN = {
  name: '1inch Aggregation Router',
  version: '6',
  chainId: 11155111, // e.g. Sepolia
  verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65', // Replace this
}

              const orderHash = hashTypedData({
          domain: DOMAIN,
          types: { Order: ORDER_TYPE },
          primaryType: 'Order',
          message: order
        })

        console.log('orderHash', orderHash)

        // 5. Create immutables tuple
    const immutables = {
      orderHash,
      hashlock,
      maker: MAKER_ADDRESS,
      taker: RESOLVER_ADDRESS,
      token: MAKER_ASSET,
      amount: makingAmount,
      safetyDeposit,
      timelocks: 10n// Example timelocks
    }

      console.log("DEPLOYER", immutables, await readContract(
        client,
        {
          address: ESCROW_FACTORY_ADDRESS,
          abi: [{"inputs":[{"internalType":"struct IBaseEscrow.Immutables","name":"immutables","type":"tuple","components":[{"internalType":"bytes32","name":"orderHash","type":"bytes32"},{"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"internalType":"Address","name":"maker","type":"uint256"},{"internalType":"Address","name":"taker","type":"uint256"},{"internalType":"Address","name":"token","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"safetyDeposit","type":"uint256"},{"internalType":"Timelocks","name":"timelocks","type":"uint256"}]}],"stateMutability":"view","type":"function","name":"addressOfEscrowSrc","outputs":[{"internalType":"address","name":"","type":"address"}]} ],
          functionName: "addressOfEscrowSrc",
          args: [immutables]
        }
      ))

            const makerAccount = privateKeyToAccount("0x435860f1d9a4732cc70f3126da6595fbc3894891da08d465e98b524cc34f7f65")

    const makerClient = createWalletClient({
      account: makerAccount,
      chain: sepolia,
      transport: http()
    })

    const signature = await makerClient.signTypedData({
      domain: DOMAIN,
      types: {Order: ORDER_TYPE},
      primaryType: 'Order',
      message: order,
    });





  //   console.log(signature, orderHash)

  // const signerAddress = await recoverTypedDataAddress({
  //   domain: DOMAIN,
  //   types: { Order: ORDER_TYPE },
  //   primaryType: 'Order',
  //   message: order,
  //   signature: signature,
  // });
  

  // const hashedRec = await recoverAddress({
  //   hash: orderHash,
  //   signature
  // })

  //   console.log(signerAddress, hashedRec, 'dihfu')


    const parse = parseSignature(signature)


    const {r, yParityAndS} = signatureToCompactSignature({r: parse.r, s: parse.s, v: parse.v})





const { traits, args: a } = buildTakerTraitsViem({
  makingAmount: true,
  extension: ext.extension,
  interaction: '0x',
});

console.log('TakerTraits:', traits.toString());
console.log('Args:', a);

// Clear bit 251 in case it's set (since deploySrc will set it)
    // 9. Prepare additional args (empty in this case)
    const args = '0x'

    // console.log(traits.toString(), BigInt(order.makerTraits))

    // // // 10. Send transaction
    // const txHash = await client.writeContract({
    //   address: RESOLVER_ADDRESS,
    //   abi: RESOLVER_ABI,
    //   functionName: 'deploySrc',
    //   args: [immutables, order, r, yParityAndS, makingAmount, traits.toString(), a],
    //   value: safetyDeposit, // For safety deposit,
    //   gas: "4000000"
    // })

    // //     const txHash = await client.writeContract({
    // //   address: RESOLVER_ADDRESS,
    // //   abi: RESOLVER_ABI,
    // //   functionName: 'withdraw',
    // //   args: [RESOLVER_ADDRESS, secret, immutables],
    // //   gas: "4000000"
    // // })

const im1 = {
  orderHash: '0x1e5f3599b00da9986d88600561ae0d3e47a5c26e1c6ea2770bed76dc20017e84',
  hashlock: '0x6274a181059b7d29460cc52de48cade2308312bf2ca2481c01ef83a07dfad992',
  maker: 1416872469781313501271777391399689972093570135071n,
  taker: 1227202244893390199266364936321176476990815482623n,
  token: 973698271221026447328515119558928420496937858000n,
  amount: '100000',
  safetyDeposit: '10000',
  timelocks: '10'
}
    console.log(toHex(pad(toBytes("testSecret"), { size: 32 })), keccak256(toHex(pad(toBytes("testSecret"), { size: 32 }))))
        const txHash = await client.writeContract({
      address: RESOLVER_ADDRESS,
      abi: RESOLVER_ABI,
      functionName: 'withdraw',
      args: ["0xd91a1392fe760c984f01f90b6b82dce8780515f7", toHex(pad(toBytes("testSecret"), { size: 32 })), im1],
      gas: "4000000"
    })



    console.log('Transaction sent:', txHash)
    
  } catch (error) {
    console.error('Error:', error)
  }
}
function encodeTakerTraits(params) {
  // Encode according to your protocol's specs
  return (BigInt(params.amountMode) << 248n) |
         (params.amountThreshold << 8n) |
         params.extension;
}



const ORDER_TYPE = [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'takingAmount', type: 'uint256' },
    { name: 'makerTraits', type: 'uint256' },
]



async function getOrderHash(order) {
  
  console.log(order)
  const hash = await hashTypedData({
    domain: DOMAIN,
    types: { Order: ORDER_TYPE },
    primaryType: 'Order',
    message: order,
  })
  console.log(hash)
  return hash
}


// Run the script
deploySrcManually()
console.log('IMPORTANT - WHILE THE FUNCTION SUCCEEDS, WE STILL NEED TO ADD POSTINTERACTION TO DEPLOY AN ESCROW CONTRACT')
console.log('IMPORTANT - THIS LIKELY INVOLVES UPDATING MAKERTRAITS TO SUPPORT FLAGS POST_INTERACTION + HAS_EXTENSION, ADDING SALT CONSTRUCTION (SEE RESOLVER EXAMPLE), ADDING CALLDATA FOR POSTINTERACTION TO ARGS, ADDING A TARGET')
console.log('IMPORTANT - LOOK AT THIS TX 0xabe570c0ab6593d8bbe54ddb4105e89d3a674e3049e2c2590dd39f9d038830a5 postInteraction EXTENSION IS THE args INPUT ON THE ORIGINAL TX CALL')
// (recoverSignerFromRVS("0x23fe2eed0e59866c00abc203211045201c9f6318b7811040e024e4acb49d24cd", "0x5c347f270043e675f9c089765d71577da513bec92e1543962cafa323e883781e","0x5e8f5fd97ff4ac61c65b9441a74f07417a0faa0f7cb20fc83fdeef092dc46dc9"))
// 0x62d7c0b60ea7b7f11573afc4fdb8441623959dffa77428a0ea86531caa62de9e6023d4e6f69851686c6ffa7c3b6dd5050dad1062189fdcdd478520f9b55115581c




  //   const a= async() => {
  //     console.log(await recoverAddress({
  //     hash: "0x58a12b13fa2583feae6920ee0d115045e867b02199c0858601cd1badd8f6b980",
  //     signature: {
  //       r:"0x62d7c0b60ea7b7f11573afc4fdb8441623959dffa77428a0ea86531caa62de9e",
  //       s: "0x6023d4e6f69851686c6ffa7c3b6dd5050dad1062189fdcdd478520f9b5511558",
  //       v: 0n
  //     }
  //   }))

  
    
  //   console.log(await recoverAddress({hash: "0x58a12b13fa2583feae6920ee0d115045e867b02199c0858601cd1badd8f6b980", signature: "0x62d7c0b60ea7b7f11573afc4fdb8441623959dffa77428a0ea86531caa62de9e6023d4e6f69851686c6ffa7c3b6dd5050dad1062189fdcdd478520f9b55115581c"}))
  // }
  //   a()

  // const b = async () => {
  //   const account = privateKeyToAccount(PRIVATE_KEY)
  // console.log(privateKeyToAccount(PRIVATE_KEY))
  // const client = createWalletClient({
  //   account,
  //   chain: sepolia,
  //   transport: http()
  // })
  


  // _FACTORY.addressOfEscrowSrc
  // const hash = await client.sendTransaction({
  // to: "0xE6322081DCb7e5129fD6A7b7B851d8EcaDf2e69D",
  // data: "0xdea024e4789c331f5758e98b32246da1015a74a2373f9328f298e2812a5334635b6e3d4f6274a181059b7d29460cc52de48cade2308312bf2ca2481c01ef83a07dfad992000000000000000000000000f82ec24828ad0ff49591ae52258b75e0126a341f0000000000000000000000001569639f33f7b617dfd9a31a0d2a7f1f577865c1000000000000000000000000aa8e23fb1079ea71e0a56f48a2aa51851d8433d000000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000",
  // value: "10000000",
  // account,
  // gas: "10000000"
  // })

  // console.log(hash)

//         const txHash = await await client.writeContract({
//             address: "0x716D6047613769DfDe5422faE631Da38dEEa2E06",
//             abi: [{"inputs":[{"internalType":"struct IBaseEscrow.Immutables","name":"dstImmutables","type":"tuple","components":[{"internalType":"bytes32","name":"orderHash","type":"bytes32"},{"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"internalType":"Address","name":"maker","type":"uint256"},{"internalType":"Address","name":"taker","type":"uint256"},{"internalType":"Address","name":"token","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"safetyDeposit","type":"uint256"},{"internalType":"Timelocks","name":"timelocks","type":"uint256"}]},{"internalType":"uint256","name":"srcCancellationTimestamp","type":"uint256"}],"stateMutability":"payable","type":"function","name":"createDstEscrow"}],
//             functionName: 'createDstEscrow',
//             args: [{
//     orderHash: '0x789c331f5758e98b32246da1015a74a2373f9328f298e2812a5334635b6e3d4f',
//     hashlock: '0x6274a181059b7d29460cc52de48cade2308312bf2ca2481c01ef83a07dfad992',
//     maker: 1416872469781313501271777391399689972093570135071n,
//     taker: 122239062723426748531553656988754206487093994945n,
//     token: 973698271221026447328515119558928420496937858000n,
//     amount: 5000000n,
//     safetyDeposit: 10000n,
//     timelocks: 10n
//   }, "0"],
//             value: 10000n, // For safety deposit,
//             gas: "4000000"
//         })

//         console.log(txHash)

  

//   }

//   function decodeTxData({ calldata, abi }) {
//   const decoded = decodeFunctionData({
//     abi,
//     data: calldata,
//   })

//   const { args, functionName } = decoded
//   const abiItem = abi.find(f => f.type === 'function' && f.name === functionName)

//   if (!abiItem || !('inputs' in abiItem)) throw new Error('Function ABI not found or invalid')

//   const result = {}
//   abiItem.inputs.forEach((input, i) => {
//     result[input.name || `arg${i}`] = args[i]
//   })

//   return result
// }
//   b()
  




function buildTakerTraitsViem({
  makingAmount = false,
  unwrapWeth = false,
  skipMakerPermit = false,
  usePermit2 = false,
  target = '0x',
  extension = '0x',
  interaction = '0x',
  threshold = 0n,
} = {}) {
  const MAKER_AMOUNT_FLAG = 1n << 255n;
  const UNWRAP_WETH_FLAG = 1n << 254n;
  const SKIP_ORDER_PERMIT_FLAG = 1n << 253n;
  const USE_PERMIT2_FLAG = 1n << 252n;
  const ARGS_HAS_TARGET = 1n << 251n;

  const ARGS_EXTENSION_LENGTH_OFFSET = 224n;
  const ARGS_INTERACTION_LENGTH_OFFSET = 200n;

  const clean = (hex) => hex.replace(/^0x/, '').toLowerCase();

  let traits = BigInt(threshold);

  if (makingAmount) traits |= MAKER_AMOUNT_FLAG;
  if (unwrapWeth) traits |= UNWRAP_WETH_FLAG;
  if (skipMakerPermit) traits |= SKIP_ORDER_PERMIT_FLAG;
  if (usePermit2) traits |= USE_PERMIT2_FLAG;
  traits |= ARGS_HAS_TARGET;

  const extLen = BigInt(clean(extension).length / 2);
  const intLen = BigInt(clean(interaction).length / 2);

  traits |= extLen << ARGS_EXTENSION_LENGTH_OFFSET;
  traits |= intLen << ARGS_INTERACTION_LENGTH_OFFSET;
  

  const args = '0x' + clean(target) + clean(extension) + clean(interaction);

  return {
    traits,
    args,
  };
}


function buildMakerTraitsViem({
  allowedSender = '0x0000000000000000000000000000000000000000',
  shouldCheckEpoch = false,
  allowPartialFill = false,
  allowMultipleFills = true,
  usePermit2 = false,
  unwrapWeth = false,
  expiry = 0n,
  nonce = 0n,
  series = 0n,
} = {}) {
  const NO_PARTIAL_FILLS_FLAG = 255n;
  const ALLOW_MULTIPLE_FILLS_FLAG = 254n;
  const POST_INTERACTION_FLAG = 251n
  const NEED_EPOCH_CHECK_FLAG = 250n;
  const HAS_EXTENSION = 249n;
  const USE_PERMIT2_FLAG = 248n;
  const UNWRAP_WETH_FLAG = 247n;

  const clean = (hex) => hex.replace(/^0x/, '').toLowerCase();
  const last10Bytes = (hex) => BigInt('0x' + clean(hex).padStart(40, '0').slice(-40));

  const setn = (bits, flagBit, enabled) =>
    enabled ? (bits | (1n << flagBit)) : bits;

  // 40-bit assertions (optional)
  if (expiry >= (1n << 40n)) throw new Error('expiry exceeds 40 bits');
  if (nonce >= (1n << 40n)) throw new Error('nonce exceeds 40 bits');
  if (series >= (1n << 40n)) throw new Error('series exceeds 40 bits');

  let traits = 0n;

  // Pack fields into correct bit positions
  traits |= (series << 160n);
  traits |= (nonce << 120n);
  traits |= (expiry << 80n);
  traits |= last10Bytes(allowedSender); // [0..79]

  traits = setn(traits, UNWRAP_WETH_FLAG, unwrapWeth);
  traits = setn(traits, ALLOW_MULTIPLE_FILLS_FLAG, allowMultipleFills);
  traits = setn(traits, NO_PARTIAL_FILLS_FLAG, allowPartialFill);
  traits = setn(traits, POST_INTERACTION_FLAG, true)
  traits = setn(traits, HAS_EXTENSION, true) // HAS_EXTENSION

  traits = setn(traits, NEED_EPOCH_CHECK_FLAG, shouldCheckEpoch);
  traits = setn(traits, USE_PERMIT2_FLAG, usePermit2);

  return '0x' + traits.toString(16).padStart(64, '0');
}

function buildExt (
        postInteraction = '0x',
    hashlock
) {
    const allInteractions = [
        postInteraction,
    ];

    const allInteractionsConcat = allInteractions.map(trim0x).join('')

    const cumulativeSum = (sum => value => { sum += value; return sum; })(0);
    const offsets = allInteractions
        .map(a => a.length / 2 - 1)
        .map(cumulativeSum)
        .reduce((acc, a, i) => acc + (BigInt(a) << BigInt(32 * i)), 0n);

    let extension = '0x';
    if (allInteractionsConcat.length > 0) {
        extension += offsets.toString(16).padStart(64, '0') + allInteractionsConcat;
    }
    extension = "0x0000010f0000004a0000004a0000004a0000004a000000250000000000000000"+postInteraction.slice(2)+"00000000000000688c9d28000078000000"+postInteraction.slice(2)+"00000000000000688c9d28000078000000"+postInteraction.slice(2)+"00000000502ea634d146790ca4a6000008"+hashlock.slice(2)+"0000000000000000000000000000000000000000000000000000000000002105000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000038d7ea4c68000000000000000000000038d7ea4c680000000000000000065000000640000000a0000007a00000079000000780000000a"

    let salt = '1';
    if (trim0x(extension).length > 0) {
        salt = BigInt(keccak256(extension)) & ((1n << 160n) - 1n); // Use 160 bit of extension hash
    }


    return {
        salt,
        extension,
    };
}


  
