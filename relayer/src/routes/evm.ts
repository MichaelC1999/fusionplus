import { Router } from 'express'
import {config} from 'dotenv'
import { compactSignatureToSignature, createPublicClient, createWalletClient, decodeEventLog, http, keccak256, pad, recoverAddress, toBytes, toHex, webSocket, zeroAddress, zeroHash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { suiDepositDst, suiWithdrawDst } from './sui'
config({path: "../.env"})
const RESOLVER_ABI = [{"type":"constructor","inputs":[{"name":"factory","type":"address","internalType":"contract IEscrowFactory"},{"name":"lop","type":"address","internalType":"contract IOrderMixin"},{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"arbitraryCalls","inputs":[{"name":"targets","type":"address[]","internalType":"address[]"},{"name":"arguments","type":"bytes[]","internalType":"bytes[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"cancel","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deployDst","inputs":[{"name":"dstImmutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"srcCancellationTimestamp","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"deploySrc","inputs":[{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]},{"name":"order","type":"tuple","internalType":"struct IOrderMixin.Order","components":[{"name":"salt","type":"uint256","internalType":"uint256"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"receiver","type":"uint256","internalType":"Address"},{"name":"makerAsset","type":"uint256","internalType":"Address"},{"name":"takerAsset","type":"uint256","internalType":"Address"},{"name":"makingAmount","type":"uint256","internalType":"uint256"},{"name":"takingAmount","type":"uint256","internalType":"uint256"},{"name":"makerTraits","type":"uint256","internalType":"MakerTraits"}]},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"vs","type":"bytes32","internalType":"bytes32"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"takerTraits","type":"uint256","internalType":"TakerTraits"},{"name":"args","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdraw","inputs":[{"name":"escrow","type":"address","internalType":"contract IEscrow"},{"name":"secret","type":"bytes32","internalType":"bytes32"},{"name":"immutables","type":"tuple","internalType":"struct IBaseEscrow.Immutables","components":[{"name":"orderHash","type":"bytes32","internalType":"bytes32"},{"name":"hashlock","type":"bytes32","internalType":"bytes32"},{"name":"maker","type":"uint256","internalType":"Address"},{"name":"taker","type":"uint256","internalType":"Address"},{"name":"token","type":"uint256","internalType":"Address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"safetyDeposit","type":"uint256","internalType":"uint256"},{"name":"timelocks","type":"uint256","internalType":"Timelocks"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"error","name":"InvalidLength","inputs":[]},{"type":"error","name":"LengthMismatch","inputs":[]},{"type":"error","name":"NativeTokenSendingFailure","inputs":[]},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}, {"inputs":[{"internalType":"struct IBaseEscrow.Immutables","name":"dstImmutables","type":"tuple","components":[{"internalType":"bytes32","name":"orderHash","type":"bytes32"},{"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"internalType":"Address","name":"maker","type":"uint256"},{"internalType":"Address","name":"taker","type":"uint256"},{"internalType":"Address","name":"token","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"safetyDeposit","type":"uint256"},{"internalType":"Timelocks","name":"timelocks","type":"uint256"}]},{"internalType":"uint256","name":"srcCancellationTimestamp","type":"uint256"}],"stateMutability":"payable","type":"function","name":"createDstEscrow"}]

const router = Router()

// hardcodes
export const evmUSDT = '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0' // Source token address
export const evmSafetyDeposit = '100000000' // Example: 0.001 ETH
const resolverAddress = '0x787b77962010c893F2AA37895e2cD73a6F68599e' // Resolver contract address
const ESCROW_FACTORY_ADDRESS = '0xC903AD0Bfc63D3e0A91E5f7ABE377596fA8E4444' // Replace with EscrowFactory address

router.post('/relay-intent', async (req: any, res: any) => {
 
    //PARAMS RECEIVED BY FE
    const r = req.body.r
    const sv = req.body.sv
    const order = JSON.parse(req.body.order)
    const orderHash = req.body.orderHash
    const salt = order.salt
    const hashlock = req.body.hashlock
    const full32ByteSuiAddress = req.body.fullSuiRecipient // THE order.recipient IS THE LAST 20 BYTES OF THIS VALUE
    const extension = req.body.extension
    const secret = req.body.secret
    
    const makingAmount = req.body.makingAmount
    const takingAmount = req.body.takingAmount
    
    //derived fields
    const sig = compactSignatureToSignature({r, yParityAndS: sv})
    const makerAddress = await recoverAddress({hash: orderHash, signature: sig})

    const immutables = {
        orderHash,
        hashlock: hashlock,
        maker: makerAddress,
        taker: resolverAddress,
        token: evmUSDT,
        amount: makingAmount,
        safetyDeposit: evmSafetyDeposit,
        timelocks: "10"// Example timelocks
    }


    const { traits, args: a } = buildTakerTraitsViem({
    makingAmount: true,
    extension: extension,
    interaction: '0x',
    });
    console.log(order, immutables)
    const evmDeposit = await resolverDepositSrc({immutables, order, r, sv, takerTraits: traits.toString(), args: a})
    console.log(evmDeposit, 'evmDeosit')
    const {tx: suiDeposit, escrowObjectId} = await suiDepositDst(takingAmount, full32ByteSuiAddress, secret)
    res.json({
        success: true,
        data: {
            evmDeposit:evmDeposit,
            suiDeposit: suiDeposit,
            evmEscrow: await getEvmEscrowSrc(evmDeposit),
            suiEscrow: escrowObjectId
        }
    });

})

router.post('/relay-secret', async (req: any, res: any) => {

    const r = req.body.r
    const sv = req.body.sv
    const orderHash = req.body.orderHash
    const hashlock = req.body.hashlock
    const secret = req.body.secret
    
    const makingAmount = req.body.makingAmount
    const takingAmount = req.body.takingAmount

    const evmEscrow = req.body.evmEscrow
    const suiEscrow = req.body.suiEscrow
    
    //derived fields
    const sig = compactSignatureToSignature({r, yParityAndS: sv})
    const makerAddress = await recoverAddress({hash: orderHash, signature: sig})

    const immutables = {
        orderHash,
        hashlock: hashlock,
        maker: makerAddress,
        taker: resolverAddress,
        token: evmUSDT,
        amount: makingAmount,
        safetyDeposit: evmSafetyDeposit,
        timelocks: "10"// Example timelocks
    }

    const evmWithdraw = await resolverWithdrawSrc(immutables, toHex(pad(toBytes(secret), { size: 32 })), evmEscrow)
    const suiWithdraw = await suiWithdrawDst(suiEscrow, secret)
    res.json({
        success: true,
        data: {
            evmWithdraw,
            suiWithdraw
        }
    });
})


const resolverDepositSrc = async ({immutables, order, r, sv, takerTraits, args}) => {
    // deposit to evm
    try {
        const wallet = createWalletClient({
            account: privateKeyToAccount(process.env.PRIVATE_KEY as any),
            chain: sepolia,
            transport: webSocket("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
        });


        const txHash = await await wallet.writeContract({
            address: resolverAddress,
            abi: RESOLVER_ABI,
            functionName: 'deploySrc',
            args: [immutables, order, r, sv, immutables.amount, takerTraits, args],
            value: immutables.safetyDeposit, // For safety deposit,
            gas: "4000000"
        } as any)

        console.log(txHash)

        return txHash

    } catch (err) {
        console.log('failed in resdeposrc', err.message)
    }
    return zeroHash

}


const resolverWithdrawSrc = async  (immutables, hexSecret, evmEscrowAddress) => {

  const wallet = createWalletClient({
      account: privateKeyToAccount(process.env.PRIVATE_KEY as any),
      chain: sepolia,
      transport: webSocket("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
  });          
  // use ethereumDepositHash to read logs and get the escrow address
  const txHash = await wallet.writeContract({
    address: resolverAddress,
    abi: RESOLVER_ABI,
    functionName: 'withdraw',
    args: [evmEscrowAddress, hexSecret, immutables],
    gas: "4000000"
  } as any)

  console.log(txHash)

  return txHash    
}

export const evmWithdrawDst = async (immutables, hexSecret, evmEscrowAddress) => {

  const wallet = createWalletClient({
      account: privateKeyToAccount(process.env.PRIVATE_KEY as any),
      chain: sepolia,
      transport: webSocket("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
  });


  const txHash = await wallet.writeContract({
    address: resolverAddress,
    abi: RESOLVER_ABI,
    functionName: 'withdraw',
    args: [evmEscrowAddress, hexSecret, immutables],
    gas: "4000000"
  } as any)
  
  console.log(txHash)
  return txHash
}

export const evmDepositDst = async (immutables) => {
        try {
        const wallet = createWalletClient({
            account: privateKeyToAccount(process.env.PRIVATE_KEY as any),
            chain: sepolia,
            transport: webSocket("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
        });

        console.log(immutables)


        const txHash = await wallet.writeContract({
            address: ESCROW_FACTORY_ADDRESS,
            abi: RESOLVER_ABI,
            functionName: 'createDstEscrow',
            args: [immutables, "0"],
            value: immutables.safetyDeposit, // For safety deposit,
            gas: "4000000"
        } as any)

        console.log(txHash)

        return txHash

    } catch (err) {
        console.log('failed in resdeposrc', err.message)
    }

    return zeroHash

}

export const getEvmEscrowDst = async (depositTx) => {
              const publicClient = createPublicClient({
              chain: sepolia,
              transport: http('https://sepolia.gateway.tenderly.co'), // Optionally provide a custom RPC URL inside http("https://...")
            })
            let evmEscrowAddress = zeroAddress
            try {
              const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })

  // 2. Calculate the event signature hash
  const eventSignature = 'DstEscrowCreated(address,bytes32,uint256)'
  const eventTopic = keccak256(Buffer.from(eventSignature))

  // 3. Find the log with this topic
  const matchingLog: any = receipt.logs.find((log: any) => log.topics[0] === eventTopic)
  if (!matchingLog) console.log('DstEscrowCreated event not found in logs ', receipt.logs)

  // 4. Decode the log
  const decoded: any = decodeEventLog({
    abi: [{
      type: 'event',
      name: 'DstEscrowCreated',
      inputs: [
        { indexed: false, name: 'escrow', type: 'address' },
        { indexed: false, name: 'hashlock', type: 'bytes32' },
        { indexed: false, name: 'taker', type: 'uint256' }
      ]
    }],
    data: matchingLog.data,
    topics: matchingLog.topics,
  })


        evmEscrowAddress = decoded?.args?.escrow

        console.log(evmEscrowAddress, 'EVM ESCROW')

} catch (err) {
    console.log("ERRROR::: ", err)
}
      console.log(evmEscrowAddress, 'EVM ESCROW')
return evmEscrowAddress

}

export const getEvmEscrowSrc = async (depositTx) => {
  const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co'), // Optionally provide a custom RPC URL inside http("https://...")
})
let evmEscrowAddress = zeroAddress
try {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })

  // 2. Calculate the event signature hash
  const eventSignature = 'Transfer(address,address,uint256)'
  const eventTopic = keccak256(Buffer.from(eventSignature))

  // 3. Find matching Transfer event log
  const matchingLog: any = receipt.logs.find((log: any) => log.topics[0] === eventTopic)
  if (!matchingLog) throw new Error('Transfer event not found in logs')

  // 4. Decode the log using Viem
  const decoded: any = decodeEventLog({
    abi: [{
      type: 'event',
      name: 'Transfer',
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ]
    }],
    data: matchingLog.data,
    topics: matchingLog.topics,
  })

        evmEscrowAddress = decoded?.args?.to

        
      } catch (err) {
        console.log("ERRROR::: ", err)
      }
      console.log(evmEscrowAddress, 'EVM ESCROW')
return evmEscrowAddress
}

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

export default router

