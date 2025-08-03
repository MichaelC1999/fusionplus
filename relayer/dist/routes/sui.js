"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suiWithdrawDst = exports.suiDepositDst = exports.MY_COIN_MODULE = exports.MY_COIN_PACKAGE_ID = exports.CLOCK_ID = exports.TREASURYCAP_OBJECT_ID = exports.ESCROW_PACKAGE_ID = void 0;
const express_1 = require("express");
const dotenv_1 = require("dotenv");
const secp256r1_1 = require("@mysten/sui/keypairs/secp256r1");
const bcs_1 = require("@mysten/bcs");
const client_1 = require("@mysten/sui/client");
const evm_1 = require("./evm");
const viem_1 = require("viem");
const transactions_1 = require("@mysten/sui/transactions");
(0, dotenv_1.config)({ path: "../.env" });
const router = (0, express_1.Router)();
exports.ESCROW_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2';
exports.TREASURYCAP_OBJECT_ID = "0xaa7990dba3409f754309638de00ce07a35148981f136601f20b98940067a3871";
exports.CLOCK_ID = '0x6';
exports.MY_COIN_PACKAGE_ID = '0xc41457ee7bad111f871f2f0e811b942c23bff4aaf69bf83dbda30b846b2af6a2';
exports.MY_COIN_MODULE = '::my_coin::MY_COIN';
router.post('/relay-intent', async (req, res) => {
    const txBytes = req.body.txBytes;
    const senderSig = req.body.signature;
    const hashlock = req.body.hashlock;
    const dstAddr = req.body.dstAddr;
    const secret = req.body.secret;
    const takingAmount = req.body.takingAmount;
    const orderHash = req.body.orderHash;
    console.log('Sui order hash', orderHash);
    const txb = transactions_1.Transaction.from(txBytes);
    const transactionObj = JSON.parse(await txb.toJSON());
    // IMPORTANT - This Should reflect values executable in EVM (EVM taker address, asset etc)
    const immutables = {
        orderHash,
        hashlock: hashlock,
        maker: BigInt(suiObjectToEvmAddress(transactionObj.sender)),
        taker: BigInt(dstAddr),
        token: BigInt(evm_1.evmUSDT),
        amount: takingAmount,
        safetyDeposit: "10000",
        timelocks: "10" // Example timelocks
    };
    const { tx: suiDeposit, escrowObjectId } = await resolverDepositSrc(txBytes, senderSig);
    const evmDeposit = await (0, evm_1.evmDepositDst)(immutables);
    res.json({
        success: true,
        data: {
            evmDeposit: evmDeposit,
            suiDeposit: suiDeposit,
            evmEscrow: await (0, evm_1.getEvmEscrowDst)(evmDeposit),
            suiEscrow: escrowObjectId
        }
    });
});
router.post('/relay-secret', async (req, res) => {
    const evmEscrow = req.body.evmEscrow;
    const suiEscrow = req.body.suiEscrow;
    const secret = req.body.secret;
    const txBytes = req.body.txBytes;
    const hashlock = req.body.hashlock;
    const dstAddr = req.body.dstAddr;
    const takingAmount = req.body.takingAmount;
    console.log();
    const orderHash = req.body.orderHash;
    console.log('Sui order hash', orderHash);
    const txb = transactions_1.Transaction.from(txBytes);
    const transactionObj = JSON.parse(await txb.toJSON());
    // IMPORTANT - This Should reflect values executable in EVM (EVM taker address, asset etc)
    const immutables = {
        orderHash,
        hashlock: hashlock,
        maker: BigInt(suiObjectToEvmAddress(transactionObj.sender)),
        taker: BigInt(dstAddr),
        token: BigInt(evm_1.evmUSDT),
        amount: takingAmount,
        safetyDeposit: "10000",
        timelocks: "10" // Example timelocks
    };
    const suiWithdraw = await suiWithdrawSrc(suiEscrow, secret);
    const evmWithdraw = await (0, evm_1.evmWithdrawDst)(immutables, (0, viem_1.toHex)((0, viem_1.pad)((0, viem_1.toBytes)(secret), { size: 32 })), evmEscrow);
    res.json({
        success: true,
        data: {
            evmWithdraw,
            suiWithdraw
        }
    });
});
const resolverDepositSrc = async (txBytes, senderSig) => {
    const acc = secp256r1_1.Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8");
    const signatureRes2 = await acc.signTransaction((0, bcs_1.fromBase64)(txBytes));
    const client = new client_1.SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
    const result = await client.executeTransactionBlock({ transactionBlock: (0, bcs_1.fromBase64)(txBytes), signature: [senderSig, signatureRes2.signature], options: {
            showEffects: true,
            showObjectChanges: true,
        } });
    const escrowObjectId = result.objectChanges?.find(x => x.type === "created")?.objectId || result.effects?.created?.[0]?.reference?.objectId; // The Escrow created
    return { escrowObjectId, tx: result.digest };
};
const suiWithdrawSrc = async (escrowObjectId, secret) => {
    const acc = secp256r1_1.Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8");
    console.log(await acc.toSuiAddress());
    const txb = new transactions_1.Transaction();
    const client = new client_1.SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
    txb.moveCall({
        target: `${exports.ESCROW_PACKAGE_ID}::escrow::withdraw`,
        typeArguments: [exports.MY_COIN_PACKAGE_ID + exports.MY_COIN_MODULE], // e.g., "0x123::my_coin::MY_COIN"
        arguments: [
            txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
            txb.pure.vector('u8', Array.from(new Uint8Array(Buffer.from((0, viem_1.stringToHex)(secret).slice(2), 'hex')))),
            txb.object(exports.CLOCK_ID) // Clock object reference
        ]
    });
    // Set the sender and gas payment
    txb.setGasBudget(10000000);
    console.log(escrowObjectId, 'WITHDRAW FROM OBJECT');
    const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
            showEffects: true,
            showObjectChanges: true
        } });
    console.log(result);
    console.log('SHOULD HAVE FINISHED TRANSFER TO TAKER ON SRC CHAIN');
    return result.digest;
};
const suiDepositDst = async (escrowAmount, recipient, secret) => {
    const acc = secp256r1_1.Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8");
    console.log(await acc.toSuiAddress());
    const txb = new transactions_1.Transaction();
    const secretHash = (0, viem_1.keccak256)((0, viem_1.stringToHex)(secret));
    const secretHashVec = new Uint8Array(Buffer.from(secretHash.slice(2), 'hex'));
    const merkleRootVec = new Uint8Array([]); // for now
    const client = new client_1.SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
    const suiCoins = await client.getCoins({ owner: acc.toSuiAddress(), coinType: '0x2::sui::SUI' });
    const escrowCoins = await client.getCoins({ owner: acc.toSuiAddress(), coinType: exports.MY_COIN_PACKAGE_ID + exports.MY_COIN_MODULE });
    const gasCoin = suiCoins.data[0].coinObjectId;
    // Split SUI into [gas, safetyDeposit]
    const safetyDepositCoin = txb.splitCoins(txb.gas, // refers to gas object implicitly
    [txb.pure.u64('10000000')] // 10 million for safety deposit
    );
    // Set the remaining SUI as the explicit gas payment
    txb.setGasPayment([
        {
            objectId: gasCoin,
            version: suiCoins.data[0].version,
            digest: suiCoins.data[0].digest,
        }
    ]);
    // Now split escrow coin
    const escrowCoin = txb.splitCoins(txb.object(escrowCoins.data[0].coinObjectId), [txb.pure.u64(escrowAmount)]);
    txb.moveCall({
        target: `${exports.ESCROW_PACKAGE_ID}::escrow::deposit_dst`,
        typeArguments: [exports.MY_COIN_PACKAGE_ID + exports.MY_COIN_MODULE],
        arguments: [
            txb.pure.vector('u8', Array.from(secretHashVec)),
            safetyDepositCoin,
            txb.pure.address(recipient),
            txb.pure.vector('u8', Array.from(merkleRootVec)),
            escrowCoin,
            txb.object(exports.CLOCK_ID),
        ]
    });
    txb.setGasBudget(10000000);
    const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
            showEffects: true,
            showObjectChanges: true
        } });
    const escrowObjectId = result.objectChanges?.find(x => x.type === "created")?.objectId || result.effects?.created?.[0]; // The Escrow created
    const res = { escrowObjectId, tx: result.digest };
    console.log('sui res', result);
    return res;
};
exports.suiDepositDst = suiDepositDst;
const suiWithdrawDst = async (escrowObjectId, secret) => {
    const acc = secp256r1_1.Secp256r1Keypair.fromSecretKey("suiprivkey1q265fsvtszsfwphahterdlj5taqz8lchhpwza077h4q9xc4zagkvvtsx7a8");
    const txb = new transactions_1.Transaction();
    const client = new client_1.SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
    txb.moveCall({
        target: `${exports.ESCROW_PACKAGE_ID}::escrow::withdraw`,
        typeArguments: [exports.MY_COIN_PACKAGE_ID + exports.MY_COIN_MODULE], // e.g., "0x123::my_coin::MY_COIN"
        arguments: [
            txb.object(escrowObjectId), // Escrow<T> object (will be consumed)
            txb.pure.vector('u8', Array.from(new Uint8Array(Buffer.from((0, viem_1.stringToHex)(secret).slice(2), 'hex')))),
            txb.object(exports.CLOCK_ID) // Clock object reference
        ]
    });
    // Set the sender and gas payment
    txb.setGasBudget(10000000);
    const result = await client.signAndExecuteTransaction({ transaction: txb, signer: acc, options: {
            showEffects: true,
            showObjectChanges: true
        } });
    console.log(result);
    console.log('SHOULD HAVE FINISHED TRANSFER TO RECIPIENT ON DST CHAIN');
    return result.digest;
};
exports.suiWithdrawDst = suiWithdrawDst;
const suiObjectToEvmAddress = (objectString) => {
    const hash = (0, viem_1.keccak256)((0, viem_1.toHex)(objectString));
    // 3. Take the last 20 bytes (40 hex chars) for EVM address
    const evmAddress = `0x${hash.slice(-40)}`;
    // 4. Apply EIP-55 checksum
    const checksumAddress = (0, viem_1.getAddress)(evmAddress);
    return checksumAddress;
};
exports.default = router;
