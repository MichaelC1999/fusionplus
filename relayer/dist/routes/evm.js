"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evmDepositDst = exports.evmWithdrawDst = exports.factoryAddress = exports.evmSafetyDeposit = exports.resolverContractAddress = exports.EVM_ASSET = void 0;
const express_1 = require("express");
const dotenv_1 = require("dotenv");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const sui_1 = require("./sui");
(0, dotenv_1.config)({ path: "../.env" });
const RESOLVER_ABI = [{ "type": "constructor", "inputs": [{ "name": "factory", "type": "address", "internalType": "contract IEscrowFactory" }, { "name": "lop", "type": "address", "internalType": "contract IOrderMixin" }, { "name": "initialOwner", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" }, { "type": "receive", "stateMutability": "payable" }, { "type": "function", "name": "arbitraryCalls", "inputs": [{ "name": "targets", "type": "address[]", "internalType": "address[]" }, { "name": "arguments", "type": "bytes[]", "internalType": "bytes[]" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "cancel", "inputs": [{ "name": "escrow", "type": "address", "internalType": "contract IEscrow" }, { "name": "immutables", "type": "tuple", "internalType": "struct IBaseEscrow.Immutables", "components": [{ "name": "orderHash", "type": "bytes32", "internalType": "bytes32" }, { "name": "hashlock", "type": "bytes32", "internalType": "bytes32" }, { "name": "maker", "type": "uint256", "internalType": "Address" }, { "name": "taker", "type": "uint256", "internalType": "Address" }, { "name": "token", "type": "uint256", "internalType": "Address" }, { "name": "amount", "type": "uint256", "internalType": "uint256" }, { "name": "safetyDeposit", "type": "uint256", "internalType": "uint256" }, { "name": "timelocks", "type": "uint256", "internalType": "Timelocks" }] }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "deployDst", "inputs": [{ "name": "dstImmutables", "type": "tuple", "internalType": "struct IBaseEscrow.Immutables", "components": [{ "name": "orderHash", "type": "bytes32", "internalType": "bytes32" }, { "name": "hashlock", "type": "bytes32", "internalType": "bytes32" }, { "name": "maker", "type": "uint256", "internalType": "Address" }, { "name": "taker", "type": "uint256", "internalType": "Address" }, { "name": "token", "type": "uint256", "internalType": "Address" }, { "name": "amount", "type": "uint256", "internalType": "uint256" }, { "name": "safetyDeposit", "type": "uint256", "internalType": "uint256" }, { "name": "timelocks", "type": "uint256", "internalType": "Timelocks" }] }, { "name": "srcCancellationTimestamp", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "payable" }, { "type": "function", "name": "deploySrc", "inputs": [{ "name": "immutables", "type": "tuple", "internalType": "struct IBaseEscrow.Immutables", "components": [{ "name": "orderHash", "type": "bytes32", "internalType": "bytes32" }, { "name": "hashlock", "type": "bytes32", "internalType": "bytes32" }, { "name": "maker", "type": "uint256", "internalType": "Address" }, { "name": "taker", "type": "uint256", "internalType": "Address" }, { "name": "token", "type": "uint256", "internalType": "Address" }, { "name": "amount", "type": "uint256", "internalType": "uint256" }, { "name": "safetyDeposit", "type": "uint256", "internalType": "uint256" }, { "name": "timelocks", "type": "uint256", "internalType": "Timelocks" }] }, { "name": "order", "type": "tuple", "internalType": "struct IOrderMixin.Order", "components": [{ "name": "salt", "type": "uint256", "internalType": "uint256" }, { "name": "maker", "type": "uint256", "internalType": "Address" }, { "name": "receiver", "type": "uint256", "internalType": "Address" }, { "name": "makerAsset", "type": "uint256", "internalType": "Address" }, { "name": "takerAsset", "type": "uint256", "internalType": "Address" }, { "name": "makingAmount", "type": "uint256", "internalType": "uint256" }, { "name": "takingAmount", "type": "uint256", "internalType": "uint256" }, { "name": "makerTraits", "type": "uint256", "internalType": "MakerTraits" }] }, { "name": "r", "type": "bytes32", "internalType": "bytes32" }, { "name": "vs", "type": "bytes32", "internalType": "bytes32" }, { "name": "amount", "type": "uint256", "internalType": "uint256" }, { "name": "takerTraits", "type": "uint256", "internalType": "TakerTraits" }, { "name": "args", "type": "bytes", "internalType": "bytes" }], "outputs": [], "stateMutability": "payable" }, { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "transferOwnership", "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "withdraw", "inputs": [{ "name": "escrow", "type": "address", "internalType": "contract IEscrow" }, { "name": "secret", "type": "bytes32", "internalType": "bytes32" }, { "name": "immutables", "type": "tuple", "internalType": "struct IBaseEscrow.Immutables", "components": [{ "name": "orderHash", "type": "bytes32", "internalType": "bytes32" }, { "name": "hashlock", "type": "bytes32", "internalType": "bytes32" }, { "name": "maker", "type": "uint256", "internalType": "Address" }, { "name": "taker", "type": "uint256", "internalType": "Address" }, { "name": "token", "type": "uint256", "internalType": "Address" }, { "name": "amount", "type": "uint256", "internalType": "uint256" }, { "name": "safetyDeposit", "type": "uint256", "internalType": "uint256" }, { "name": "timelocks", "type": "uint256", "internalType": "Timelocks" }] }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "event", "name": "OwnershipTransferred", "inputs": [{ "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" }, { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }], "anonymous": false }, { "type": "error", "name": "InvalidLength", "inputs": [] }, { "type": "error", "name": "LengthMismatch", "inputs": [] }, { "type": "error", "name": "NativeTokenSendingFailure", "inputs": [] }, { "type": "error", "name": "OwnableInvalidOwner", "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }] }, { "type": "error", "name": "OwnableUnauthorizedAccount", "inputs": [{ "name": "account", "type": "address", "internalType": "address" }] }, { "inputs": [{ "internalType": "struct IBaseEscrow.Immutables", "name": "dstImmutables", "type": "tuple", "components": [{ "internalType": "bytes32", "name": "orderHash", "type": "bytes32" }, { "internalType": "bytes32", "name": "hashlock", "type": "bytes32" }, { "internalType": "Address", "name": "maker", "type": "uint256" }, { "internalType": "Address", "name": "taker", "type": "uint256" }, { "internalType": "Address", "name": "token", "type": "uint256" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "safetyDeposit", "type": "uint256" }, { "internalType": "Timelocks", "name": "timelocks", "type": "uint256" }] }, { "internalType": "uint256", "name": "srcCancellationTimestamp", "type": "uint256" }], "stateMutability": "payable", "type": "function", "name": "createDstEscrow" }];
const router = (0, express_1.Router)();
// hardcodes
exports.EVM_ASSET = '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0'; // Source token address
exports.resolverContractAddress = '0x8E4712636BF595D59c0137733E3cb4681F6185e2';
exports.evmSafetyDeposit = '100000000'; // Example: 0.001 ETH
exports.factoryAddress = "0x716D6047613769DfDe5422faE631Da38dEEa2E06";
router.post('/relay-intent', async (req, res) => {
    const secret = "TestSecret";
    //PARAMS RECEIVED BY FE
    const r = req.body.r;
    const sv = req.body.sv;
    const order = JSON.parse(req.body.order);
    const orderHash = req.body.orderHash;
    const salt = req.body.salt;
    const hashlock = req.body.hashlock;
    const full32ByteSuiAddress = req.body.fullSuiRecipient; // THE order.recipient IS THE LAST 20 BYTES OF THIS VALUE
    const makingAmount = req.body.makingAmount;
    const takingAmount = req.body.takingAmount;
    //derived fields
    const takerAddress = (0, accounts_1.privateKeyToAccount)(process.env.PRIVATE_KEY)?.address;
    const sig = (0, viem_1.compactSignatureToSignature)({ r, yParityAndS: sv });
    const MAKER_ADDRESS = await (0, viem_1.recoverAddress)({ hash: orderHash, signature: sig }); // Your address
    const immutables = {
        orderHash,
        hashlock: hashlock,
        maker: MAKER_ADDRESS,
        taker: takerAddress,
        token: exports.EVM_ASSET,
        amount: makingAmount,
        safetyDeposit: exports.evmSafetyDeposit,
        timelocks: "10" // Example timelocks
    };
    const takerTraits = "61514547407324228818772085785865451047049679353621549645961841504203850121216";
    const args = "0x";
    console.log(order, immutables);
    const ethereumDepositHash = await resolverDepositSrc({ immutables, order, resolverContractAddress: exports.resolverContractAddress, r, sv, takerTraits, args });
    // IMPORTANT - NEED TO SEPARATE RELAYER (DECLARATIONS) FROM RESOLVERS (EXECUTION)
    const { tx: suiDepositHash, escrowObjectId } = await (0, sui_1.suiDepositDst)('5000000', full32ByteSuiAddress);
    const ethereumWithdrawHash = await resolverWithdrawSrc();
    const suiWithdrawhash = await (0, sui_1.suiWithdrawDst)(escrowObjectId, secret);
    console.log({ ethereumDepositHash, suiDepositHash, ethereumWithdrawHash, suiWithdrawhash });
});
const resolverDepositSrc = async ({ immutables, order, resolverContractAddress, r, sv, takerTraits, args }) => {
    // deposit to evm
    try {
        const wallet = (0, viem_1.createWalletClient)({
            account: (0, accounts_1.privateKeyToAccount)(process.env.PRIVATE_KEY),
            chain: chains_1.sepolia,
            transport: (0, viem_1.webSocket)("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
        });
        const txHash = await await wallet.writeContract({
            address: resolverContractAddress,
            abi: RESOLVER_ABI,
            functionName: 'deploySrc',
            args: [immutables, order, r, sv, immutables.amount, takerTraits, args],
            value: immutables.safetyDeposit, // For safety deposit,
            gas: "4000000"
        });
        console.log(txHash);
        return txHash;
    }
    catch (err) {
        console.log('failed in resdeposrc', err.message);
    }
    return viem_1.zeroHash;
};
const resolverWithdrawSrc = async () => {
    return viem_1.zeroHash;
};
const evmWithdrawDst = async () => {
    return viem_1.zeroHash;
};
exports.evmWithdrawDst = evmWithdrawDst;
const evmDepositDst = async (immutables) => {
    try {
        const wallet = (0, viem_1.createWalletClient)({
            account: (0, accounts_1.privateKeyToAccount)(process.env.PRIVATE_KEY),
            chain: chains_1.sepolia,
            transport: (0, viem_1.webSocket)("wss://sepolia.infura.io/ws/v3/2FmomdoPjwHwbT7K8gDYR4boBoD"),
        });
        console.log(immutables);
        const txHash = await await wallet.writeContract({
            address: exports.factoryAddress,
            abi: RESOLVER_ABI,
            functionName: 'createDstEscrow',
            args: [immutables, "0"],
            value: immutables.safetyDeposit, // For safety deposit,
            gas: "4000000"
        });
        console.log(txHash);
        return txHash;
    }
    catch (err) {
        console.log('failed in resdeposrc', err.message);
    }
    return viem_1.zeroHash;
};
exports.evmDepositDst = evmDepositDst;
exports.default = router;
