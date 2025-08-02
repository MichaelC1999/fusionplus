import { Router } from 'express'
import {config} from 'dotenv'
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { fromBase64 } from '@mysten/bcs';
import { SuiClient } from '@mysten/sui/client';
import { EVM_ASSET, evmDepositDst, evmWithdrawDst } from './evm';
import { getAddress, keccak256, stringToHex, toHex, zeroHash } from 'viem';
import { Transaction } from '@mysten/sui/transactions';

config({path: "../.env"})

const router = Router()

export const ESCROW_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2';
export const TREASURYCAP_OBJECT_ID = "0xaa7990dba3409f754309638de00ce07a35148981f136601f20b98940067a3871"
export const CLOCK_ID = '0x6';
export const MY_COIN_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2'
export const MY_COIN_MODULE = '::my_coin::MY_COIN';

router.post('/relay-intent', async (req: any, res: any) => {

    const secret = "TestSecret"

    const txBytes = req.body.txBytes
    const senderSig = req.body.signature
    const hashlock = req.body.hashlock
    const dstAddr = req.body.dstAddr

    const takingAmount = req.body.takingAmount

    const orderHash = keccak256(fromBase64(txBytes))
    console.log('Sui order hash', orderHash)
    const txb = Transaction.from(txBytes)
    const transactionObj = JSON.parse(await txb.toJSON())

    const coin = MY_COIN_PACKAGE_ID + MY_COIN_MODULE
    // 1. Define the Sui coin type (e.g., SUI or a custom coin)
    console.log(transactionObj.inputs[2].Object.ImmOrOwnedObject)
    // IMPORTANT - This Should reflect values executable in EVM (EVM taker address, asset etc)
        const immutables = {
            orderHash,
            hashlock: hashlock,
            maker: BigInt(suiObjectToEvmAddress(transactionObj.sender)),
            taker: BigInt(dstAddr),
            token: BigInt(EVM_ASSET),
            amount: takingAmount,
            safetyDeposit: "10000",
            timelocks: "10"// Example timelocks
            }
    
    const {tx: suiDepositHash, escrowObjectId} = await resolverDepositSrc(txBytes, senderSig)
    


      const ethereumDepositHash = await evmDepositDst(immutables)

      const suiWithdrawhash = await suiWithdrawSrc(escrowObjectId,secret)

      const ethereumWithdrawHash = await evmWithdrawDst()


        console.log({ethereumDepositHash, suiDepositHash, ethereumWithdrawHash, suiWithdrawhash})
        res.json({
            success: true,
            txs: {
                ethereumDepositHash,
                suiDepositHash,
                ethereumWithdrawHash,
                suiWithdrawhash
            }
        });
})

const resolverDepositSrc = async (txBytes, senderSig) => {
      const acc: any = Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8")


      const signatureRes2 = await acc.signTransaction(fromBase64(txBytes))
      
      const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443"  });
      const result = await client.executeTransactionBlock({transactionBlock: fromBase64(txBytes),signature: [senderSig, signatureRes2.signature], options: {
          showEffects: true,
          showObjectChanges: true
        }})

const escrowObjectId=result.objectChanges?.find(x => x.type==="created")?.objectId || zeroHash // The Escrow created
      return {escrowObjectId, tx: result.digest}

}

const suiWithdrawSrc = async (escrowObjectId, secret) => {

        const acc: any = Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8")
  console.log(await acc.toSuiAddress())
  const txb = new Transaction();
      const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443"  });

                  
  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::withdraw`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE ], // e.g., "0x123::my_coin::MY_COIN"
    arguments: [
      txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
      txb.pure.vector('u8', Array.from(new Uint8Array(Buffer.from(stringToHex(secret).slice(2), 'hex')))),
      txb.object(CLOCK_ID)       // Clock object reference
    ]
  });


  // Set the sender and gas payment
  txb.setGasBudget(10000000);

          console.log(escrowObjectId, 'WITHDRAW FROM OBJECT')
          const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
          showEffects: true,
          showObjectChanges: true
        } });

  console.log(result)

  console.log('SHOULD HAVE FINISHED TRANSFER TO TAKER ON SRC CHAIN')


  return result.digest;
}

export const suiDepositDst = async ( escrowAmount, recipient) => {
      const acc: any = Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8")
  console.log(await acc.toSuiAddress())

      const txb = new Transaction();
    
      const secretHash = keccak256(stringToHex("TestSecret"))
        const secretHashVec: Uint8Array = new Uint8Array(Buffer.from(secretHash.slice(2), 'hex'));
        
        const merkleRootVec: Uint8Array = new Uint8Array([]); // for now
          const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443"  });

      const suiCoins = await client.getCoins({ owner: acc.toSuiAddress(), coinType: '0x2::sui::SUI' });
      const escrowCoins = await client.getCoins({ owner: acc.toSuiAddress(), coinType: MY_COIN_PACKAGE_ID + MY_COIN_MODULE });
    
      if (!suiCoins.data.length || !escrowCoins.data.length) throw new Error('Insufficient coins');

      const safetyDepositCoin = txb.splitCoins(txb.object(suiCoins.data[0].coinObjectId), [txb.pure.u64("10000")]);
      const escrowCoin = txb.splitCoins(txb.object(escrowCoins.data[0].coinObjectId), [txb.pure.u64(escrowAmount)]);
      txb.moveCall({
        target: `${ESCROW_PACKAGE_ID}::escrow::deposit_dst`,
        typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE],
        arguments: [
          txb.pure.vector('u8', Array.from(secretHashVec)),
          safetyDepositCoin,
          txb.pure.address(recipient),
          txb.pure.vector('u8', Array.from(merkleRootVec)),
          escrowCoin,
          txb.object(CLOCK_ID),
        ]
      });
    
      txb.setGasBudget(10000000);
        const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
          showEffects: true,
          showObjectChanges: true
        } });
            console.log(result.effects.created)
            const escrowObjectId = result.objectChanges?.find(x => x.type==="created")?.objectId || zeroHash // The Escrow created
      return {escrowObjectId, tx: result.digest}
    
}

export const suiWithdrawDst = async (escrowObjectId, secret) => {

        const acc: any = Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8")


  const txb = new Transaction();
      const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443"  });

                  
  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::withdraw`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE ], // e.g., "0x123::my_coin::MY_COIN"
    arguments: [
      txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
      txb.pure.vector('u8', Array.from(new Uint8Array(Buffer.from(stringToHex(secret).slice(2), 'hex')))),
      txb.object(CLOCK_ID)       // Clock object reference
    ]
  });

  // Set the sender and gas payment
  txb.setGasBudget(10000000);


          const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
          showEffects: true,
          showObjectChanges: true
        } });

  console.log(result)


  console.log('SHOULD HAVE FINISHED TRANSFER TO RECIPIENT ON DST CHAIN')

  return result.digest;
}

const suiObjectToEvmAddress = (objectString) => {
    const hash = keccak256(toHex(objectString));

    // 3. Take the last 20 bytes (40 hex chars) for EVM address
    const evmAddress = `0x${hash.slice(-40)}`;

    // 4. Apply EIP-55 checksum
    const checksumAddress = getAddress(evmAddress);
    return checksumAddress
}

export default router