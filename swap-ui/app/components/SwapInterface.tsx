'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getAdapter } from '../misc/adapter'
import { createPublicClient, hashTypedData, http, keccak256, pad, parseAbi, parseSignature, recoverAddress, signatureToCompactSignature, stringToHex, toBytes, toHex, zeroAddress, zeroHash } from 'viem'
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { decodeSuiPrivateKey, Signer } from '@mysten/sui/cryptography';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { useAccount, useSignTypedData, useWriteContract, } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { sepolia } from 'viem/chains';
import { buildExt, buildMakerTraitsViem, generateRandomString, suiObjectToEvmAddress } from '../utils';
import Modal from './Modal';
import { fromB64 } from '@mysten/bcs';
import ErrorModal from './ErrorModal';


const SwapInterface: React.FC = () => {
  const [ethUSDTAmount, setEthUSDTAmount] = useState('')
  const [suiUSDTAmount, setSuiUSDTAmount] = useState('')
  const [swapOrder, setSwapOrder] = useState({})
  const [secret, setSecret] = useState(generateRandomString())
  const [isSuiSource, setIsSuiSource] = useState(false)
  const [userAccount, setUserAccount] = React.useState<WalletAccount | undefined>()
  const [modalOpen, toggleModalOpen] = useState(false)
    const [errorModalOpen, toggleErrorModalOpen] = useState(false)

  const zeroOrder = {evmDeposit: zeroAddress, suiDeposit: zeroHash, evmWithdraw: zeroAddress, suiWithdraw: zeroAddress, evmEscrow: zeroAddress, suiEscrow: zeroHash}
  const [orderStatus, setOrderStatus] = useState(zeroOrder)
    const { writeContractAsync } = useWriteContract()

  const {address: evmAddress} = useAccount()
  const {signTypedDataAsync} = useSignTypedData()
  const client = useMemo(() => {
    return new SuiClient({ url: "https://fullnode.testnet.sui.io:443"  });
  }, [])
  
  const MAKER_ASSET = '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0' // Source token address
  const TAKER_ASSET = '0xda0000d4000015a526378bb6fafc650cea5966f8' // Destination token address
  const RESOLVER_ADDRESS = '0x787b77962010c893F2AA37895e2cD73a6F68599e' // Resolver contract address
  const ESCROW_FACTORY_ADDRESS = '0xC903AD0Bfc63D3e0A91E5f7ABE377596fA8E4444' // Replace with EscrowFactory address
  const ESCROW_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2';
  const TREASURYCAP_OBJECT_ID = "0xaa7990dba3409f754309638de00ce07a35148981f136601f20b98940067a3871"
  const MY_COIN_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2'
  const MY_COIN_MODULE = '::my_coin::MY_COIN';


  useEffect(() => {
    if(!modalOpen) {
      setOrderStatus(zeroOrder)
      setSecret(generateRandomString())
    }
  }, [modalOpen])

  useEffect(() => {
    const init = async () => {
      const adapter = await getAdapter()
      if (await adapter.canEagerConnect()) {
        try {
          await adapter.connect()
          const account = await adapter.getAccounts()
          if (account[0]) {
            setUserAccount(account[0])
          }
        } catch (error) {
          await adapter.disconnect().catch(() => {})
          console.log(error)
        }
      }
    }
    init()
    // Try eagerly connect
  }, [])


  const toggleChain = () => {
    setIsSuiSource((prev) => !prev)
  }

const createEVMSignature = async (): Promise<any> => {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const nonce = await publicClient.getTransactionCount({ address: evmAddress });
  // const approveTx = await writeContractAsync({
  //   address: MAKER_ASSET,
  //   abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
  //   functionName: "approve",
  //   args:["0x111111125421ca6dc452d289314280a0f8842a65", "100000000000000000000"],
  //   account: evmAddress,
  //   chain: sepolia
  // })
  
  // console.log(approveTx)
    const secretHex = toHex(pad(toBytes(secret), { size: 32 }));
    const hashlock = keccak256(secretHex);
    console.log(hashlock);

    const ext = buildExt(ESCROW_FACTORY_ADDRESS, hashlock);
    const salt = ext.salt.toString();

    const order = {
      salt,
      maker: evmAddress,
      receiver: zeroAddress,
      makerAsset: MAKER_ASSET,
      takerAsset: TAKER_ASSET,
      makingAmount: Number(ethUSDTAmount).toFixed(),
      takingAmount: Number(suiUSDTAmount).toFixed(),
      makerTraits: buildMakerTraitsViem({
        allowedSender: '0x000000000000000000000000000000000000000',
        expiry: BigInt(0),
        nonce: BigInt(nonce),
        series: BigInt(5),
      }),
    };

    setSwapOrder(order);
    console.log(order, 'sudf');

    const signatureObject = {
      domain: {
        name: '1inch Aggregation Router',
        version: '6',
        chainId: 11155111,
        verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65',
      },
      types: {
        Order: [
          { name: 'salt', type: 'uint256' },
          { name: 'maker', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'makerAsset', type: 'address' },
          { name: 'takerAsset', type: 'address' },
          { name: 'makingAmount', type: 'uint256' },
          { name: 'takingAmount', type: 'uint256' },
          { name: 'makerTraits', type: 'uint256' },
        ],
      },
      primaryType: 'Order',
      message: order,
    };

    console.log(';reach1', order);

    const orderHash = hashTypedData(signatureObject as any);
    console.log(orderHash);

    const signature = await signTypedDataAsync(signatureObject as any);
    console.log(';reach2');

    const parsed = parseSignature(signature);
    const { r, yParityAndS } = signatureToCompactSignature({
      r: parsed.r,
      s: parsed.s,
      v: parsed.v,
    } as any);

    console.log(r, yParityAndS);

    const requestBody = {
      r,
      sv: yParityAndS,
      order: JSON.stringify(order),
      orderHash,
      hashlock,
      makingAmount: order.makingAmount,
      takingAmount: order.takingAmount,
      fullSuiRecipient: userAccount?.address,
      extension: ext.extension,
      secret,
    };

    toggleModalOpen(true);

    const response = await fetch('http://localhost:2000/evm/relay-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);

    setOrderStatus(prev => ({
      ...prev,
      evmDeposit: data.data.evmDeposit,
      suiDeposit: data.data.suiDeposit,
      evmEscrow: data.data.evmEscrow,
      suiEscrow: data.data.suiEscrow,
    }));

    requestBody.evmEscrow = data.data.evmEscrow;
    requestBody.suiEscrow = data.data.suiEscrow;

    const responseSecret = await fetch('http://localhost:2000/evm/relay-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!responseSecret.ok) {
      throw new Error(`HTTP error! status: ${responseSecret.status}`);
    }

    const secretData = await responseSecret.json();

    setOrderStatus(prev => ({
      ...prev,
      evmWithdraw: secretData.data.evmWithdraw,
      suiWithdraw: secretData.data.suiWithdraw,
    }));

    return secretData;

  } catch (error) {
    console.error('Error sending order to backend:', error);
    throw error;
  }
};


const createSuiSignature = async (): Promise<any> => {
  const adapter = await getAdapter();

  if (await adapter.canEagerConnect()) {
    try {
      await adapter.connect();
    } catch (error) {
      await adapter.disconnect().catch(() => {});
      console.log(error);
    }
  }

  const txb = new Transaction();

  const secretHash = keccak256(stringToHex(secret));
  const secretHashVec: Uint8Array = new Uint8Array(Buffer.from(secretHash.slice(2), 'hex'));
  const merkleRootVec: Uint8Array = new Uint8Array([]);

  console.log(userAccount, evmAddress);

  const suiCoins = await client.getCoins({
    owner: userAccount?.address,
    coinType: '0x2::sui::SUI',
  });

  console.log('suiCOINS', suiCoins);

  const escrowCoins = await client.getCoins({
    owner: userAccount?.address,
    coinType: MY_COIN_PACKAGE_ID + MY_COIN_MODULE,
  });

  if (!suiCoins.data.length) throw new Error('Insufficient SUI coins');
  if (!escrowCoins.data.length) throw new Error('Insufficient MY_COINS');

  const safetyDepositCoin = txb.splitCoins(
    txb.object(suiCoins.data[0].coinObjectId),
    [txb.pure.u64(10_000_000)]
  );

  const escrowCoin = txb.splitCoins(
    txb.object(escrowCoins.data[0].coinObjectId),
    [txb.pure.u64(Number(suiUSDTAmount) * 100000)]
  );

  console.log(escrowCoins, txb.pure(secretHashVec));

  txb.moveCall({
    target: `${ESCROW_PACKAGE_ID}::escrow::deposit_src`,
    typeArguments: [MY_COIN_PACKAGE_ID + MY_COIN_MODULE],
    arguments: [
      txb.pure.vector('u8', Array.from(secretHashVec)),
      safetyDepositCoin,
      txb.pure.vector('u8', Array.from(merkleRootVec)),
      escrowCoin,
      txb.object('0x6'),
    ],
  });

  txb.setSender(userAccount.address);
  txb.setGasOwner('0x851c7ec79de8d4eb77c6f55768d86849a0a7419e806d503682664cd8de678922');
  txb.setGasBudget(10_000_000);

  const signatureRes = await adapter.signTransactionBlock({
    transactionBlock: txb,
    account: userAccount,
  });

  console.log(signatureRes);

  const orderHash = keccak256(fromB64(signatureRes.transactionBlockBytes));
  console.log('Sui order hash', orderHash);

  const transactionObj = JSON.parse(await txb.toJSON());
  setSwapOrder(transactionObj);

  const reqBody = {
    txBytes: signatureRes.transactionBlockBytes,
    signature: signatureRes.signature,
    hashlock: secretHash,
    dstAddr: evmAddress,
    takingAmount: Number(ethUSDTAmount).toFixed(),
    orderHash,
    secret,
  };

  toggleModalOpen(true);

  const response = await fetch('http://localhost:2000/sui/relay-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('tx hashes:', data);

  setOrderStatus(prev => ({
    ...prev,
    evmDeposit: data.data.evmDeposit,
    suiDeposit: data.data.suiDeposit,
    evmEscrow: data.data.evmEscrow,
    suiEscrow: data.data.suiEscrow,
  }));

  reqBody.evmEscrow = data.data.evmEscrow;
  reqBody.suiEscrow = data.data.suiEscrow;

  const responseSecret = await fetch('http://localhost:2000/sui/relay-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  if (!responseSecret.ok) {
    throw new Error(`HTTP error! status: ${responseSecret.status}`);
  }

  const secretData = await responseSecret.json();

  setOrderStatus(prev => ({
    ...prev,
    evmWithdraw: secretData.data.evmWithdraw,
    suiWithdraw: secretData.data.suiWithdraw,
  }));

  return secretData;
};
  
return (
  <>
    {/* Modal */}
    <Modal
      isOpen={modalOpen}
      onClose={() => toggleModalOpen(false)}
      isSuiSource={isSuiSource}
      title={isSuiSource ? 'Sui > EVM Swap' : 'EVM > Sui Swap'}
      orderStatus={orderStatus}
      secret={secret}
      amounts={{ethUSDTAmount, suiUSDTAmount}}
        parties={{
          'Maker (EVM)': evmAddress,
          'Taker (EVM)': RESOLVER_ADDRESS,
          'Maker (Sui)': userAccount?.address,
          'Taker (Sui)': '0x851c7ec79de8d4eb77c6f55768d86849a0a7419e806d503682664cd8de678922',
        }}
    />
    <ErrorModal isOpen={(errorModalOpen)} onClose={() => toggleErrorModalOpen(false)}/>

    {/* Swap Interface */}
    <div
      style={{ zIndex: 99, top: '720px' }}
      className="relative w-full flex flex-col items-center justify-center space-y-6"
    >
      {/* Swap Panels and Toggle */}
      <div className="flex items-center justify-center space-x-12">
        {/* Left Panel */}
        <div className="flex flex-col items-center space-y-4">
          <input
            className="w-[220px] h-[50px] rounded-lg px-4 bg-black text-white border border-gray-700 glow-effect outline-none text-center"
            type="number"
            value={isSuiSource ? suiUSDTAmount : ethUSDTAmount}
            placeholder={'Making Amount'}
            onChange={(e) => {
              if (isSuiSource) {
                setSuiUSDTAmount(e.target.value);
                setEthUSDTAmount((Number(e.target.value) * 0.95).toFixed(2));
              } else {
                setEthUSDTAmount(e.target.value);
                setSuiUSDTAmount((Number(e.target.value) * 0.95).toFixed(2));
              }
            }}
          />

          <a
            href={isSuiSource ? "https://faucet.sui.io/" : "https://gho.aave.com/faucet/"}
            target="_blank"
            rel="noopener noreferrer"
            // className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
          <button className="relative overflow-hidden bg-black text-white w-[220px] h-[50px] rounded-lg glow-effect hover:scale-105 transition-transform duration-200">
            <span className="absolute inset-0 flex items-center justify-center z-10">
              {isSuiSource ? 'Sui USDT' : 'Sepolia USDT'} ▶
            </span>
                  <div className="absolute inset-0 bg-black stars-bg animate-move-stars z-0" />
          </button>

          </a>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleChain}
          className="text-white text-4xl font-bold transform hover:scale-110 transition-transform glow-effect"
        >
          <span className="absolute inset-0 flex items-center justify-center z-10">⇄</span>
        </button>

        {/* Right Panel */}
        <div className="flex flex-col items-center space-y-4">
          <button
            style={{ cursor: 'default' }}
            className="relative overflow-hidden bg-black text-white w-[220px] h-[50px] rounded-lg glow-effect hover:scale-105 transition-transform duration-200"
          >
            <span className="absolute inset-0 flex items-center justify-center z-10">
              {!isSuiSource ? suiUSDTAmount : ethUSDTAmount} USDT
            </span>
          </button>

          <button className="relative overflow-hidden bg-black text-white w-[220px] h-[50px] rounded-lg glow-effect hover:scale-105 transition-transform duration-200">
            <span className="absolute inset-0 flex items-center justify-center z-10">
              {!isSuiSource ? 'Sui Testnet' : 'Ethereum Sepolia'}
            </span>
          </button>
        </div>
      </div>

      {/* Sign Button */}
      <button
        onClick={() => {
          if (!userAccount?.address || !evmAddress) {
            toggleErrorModalOpen(true)
            return
          }
          setOrderStatus(zeroOrder);
          if (isSuiSource) {
            createSuiSignature();
          } else {
            createEVMSignature();
          }
        }}
        className="relative overflow-hidden bg-black text-white w-[220px] h-[50px] rounded-lg glow-effect hover:scale-105 transition-transform duration-200"
      >
        <span className="absolute inset-0 flex items-center justify-center z-10">
          Gasless Swap
        </span>
        <div className="absolute inset-0 bg-black stars-bg animate-move-stars z-0" />
      </button>
    </div>
  </>
);
}

export default SwapInterface
