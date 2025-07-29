const { createWalletClient, http, encodeAbiParameters, parseAbiParameters, toHex, pad, hexToBigInt, decodeFunctionData } = require( 'viem')
const { privateKeyToAccount } = require( 'viem/accounts')
const { sepolia } = require( 'viem/chains')
const { keccak256, toBytes, hashTypedData } = require( 'viem/utils')
const { randomBytes } = require( 'crypto')
const { TakerTraits, AmountMode } = require( '@1inch/cross-chain-sdk')
   require('dotenv').config();


// Configuration
const RESOLVER_ADDRESS = '0x356632888f02581f3965A832BD417E9d2a65f8a2' // Resolver contract address
const MAKER_ADDRESS = '0xD6F5A6E178B5CC4DC50e5CAeeB04C3EBf5fa32FF' // Your address
const TAKER_ADDRESS = '0xD6F5A6E178B5CC4DC50e5CAeeB04C3EBf5fa32FF' // Counterparty address
const MAKER_ASSET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // Source token address
const TAKER_ASSET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // Destination token address

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ESCROW_FACTORY_ADDRESS = '0x1AfB4549EF881c925680874109A58b8133e97BBE' // Replace with EscrowFactory address
const RESOLVER_ABI = [{"type":"constructor","inputs":[{"name":"factory","type":"address","internalType":"contract IEscrowFactory"},{"name":"lop","type":"address","internalType":"contract IOrderMixin"},{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"arbitraryCalls","inputs":[{"name":"targets","type":"address[]","internalType":"address[]"},{"name":"arguments","type":"bytes[]","internalType":"bytes[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"cancel","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deployDst","inputs":[{"name":"dstImmutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"srcCancellationTimestamp","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"deploySrc","inputs":[{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"order","type":"tuple","internalType":"struct IOrderMixin.Order","components":[{"name":"salt","type":"uint256","internalType":"uint256"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"receiver","type":"uint256","internalType":"Address"},{"name":"makerAsset","type":"uint256","internalType":"Address"},{"name":"takerAsset","type":"uint256","internalType":"Address"},{"name":"makingAmount","type":"uint256","internalType":"uint256"},{"name":"takingAmount","type":"uint256","internalType":"uint256"},{"name":"makerTraits","type":"uint256","internalType":"MakerTraits"}]},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"vs","type":"bytes32","internalType":"bytes32"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"takerTraits","type":"uint256","internalType":"TakerTraits"},{"name":"args","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdraw","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"secret","type":"bytes32","internalType":"bytes32"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"error","name":"InvalidLength","inputs":[]},{"type":"error","name":"LengthMismatch","inputs":[]},{"type":"error","name":"NativeTokenSendingFailure","inputs":[]},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}]


async function deploySrcManually() {
  try {
    // 1. Setup client and account
    const account = privateKeyToAccount(PRIVATE_KEY)
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http()
    })

    // 2. Generate random values
  const salt = 123n << 160n // upper 96 bits set to 123, lower 160 bits zero
    const secret = toHex(pad(toBytes("testSecret"), { size: 32 }))
    const hashlock = keccak256(secret)
    
    // 3. Define order parameters
    const makingAmount = '10000000' // Example: 100 tokens
    const takingAmount = '9900000' // Example: 99 tokens
    const safetyDeposit = '100000000' // Example: 0.001 ETH

    // 4. Create order hash (simplified - you may need exact same logic as contract)
    
    
    // 6. Create order tuple
    const order = {
      salt,
      maker: MAKER_ADDRESS,
      receiver: TAKER_ADDRESS,
      makerAsset: MAKER_ASSET,
      takerAsset: TAKER_ASSET,
      makingAmount,
      takingAmount,
      makerTraits: buildMakerTraitsViem({
  allowedSender: '0x000000000000000000000000000000000000000',
  allowPartialFill: false,
  allowMultipleFills: false,
  expiry: 0n,
  nonce: 123n,
  series: 5n,
})

    }
    const orderHash = await getOrderHash({...order})

        // 5. Create immutables tuple
    const immutables = {
      orderHash,
      hashlock,
      maker: MAKER_ADDRESS,
      taker: TAKER_ADDRESS,
      token: MAKER_ASSET,
      amount: makingAmount,
      safetyDeposit,
      timelocks: 10n// Example timelocks
    }
    
    // 7. Sign the order (simplified - you may need EIP-712 signing)
    const signature = await client.signMessage({
      message: { raw: toBytes(orderHash) }
    })
    const [r, vs] = [signature.slice(0, 66), `0x${signature.slice(66, 130)}`]

const { traits, args: a } = buildTakerTraitsViem({
  makingAmount: true,
  extension: '0x',
  interaction: '0x',
});

console.log('TakerTraits:', traits.toString());
console.log('Args:', a);

// Clear bit 251 in case it's set (since deploySrc will set it)
    // 9. Prepare additional args (empty in this case)
    const args = '0x'

    console.log(traits.toString())

    // 10. Send transaction
    const txHash = await client.writeContract({
      address: RESOLVER_ADDRESS,
      abi: RESOLVER_ABI,
      functionName: 'deploySrc',
      args: [immutables, order, r, vs, makingAmount, traits.toString(), args],
      value: safetyDeposit, // For safety deposit,
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

const DOMAIN = {
  name: '1inch Aggregation Router',
  version: '6',
  chainId: 11155111, // e.g. Sepolia
  verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65', // Replace this
}

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
  if (clean(target).length > 0) traits |= ARGS_HAS_TARGET;

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
  allowPartialFill = true,
  allowMultipleFills = true,
  usePermit2 = false,
  unwrapWeth = false,
  expiry = 0n,
  nonce = 0n,
  series = 0n,
} = {}) {
  const NO_PARTIAL_FILLS_FLAG = 255n;
  const ALLOW_MULTIPLE_FILLS_FLAG = 254n;
  const NEED_EPOCH_CHECK_FLAG = 250n;
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
  traits = setn(traits, NO_PARTIAL_FILLS_FLAG, !allowPartialFill);
  traits = setn(traits, NEED_EPOCH_CHECK_FLAG, shouldCheckEpoch);
  traits = setn(traits, USE_PERMIT2_FLAG, usePermit2);

  return '0x' + traits.toString(16).padStart(64, '0');
}
