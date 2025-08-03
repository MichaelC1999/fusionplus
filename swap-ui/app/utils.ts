import { getAddress, keccak256, toHex } from "viem";
export function generateRandomString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(10)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const suiObjectToEvmAddress = (objectString) => {
    const hash = keccak256(toHex(objectString));

    // 3. Take the last 20 bytes (40 hex chars) for EVM address
    const evmAddress = `0x${hash.slice(-40)}`;

    // 4. Apply EIP-55 checksum
    const checksumAddress = getAddress(evmAddress);
    return checksumAddress
}
export function buildMakerTraitsViem({
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
  console.log('TRAITS BEFORE', traits)
  traits |= (nonce << 120n);
  console.log("TRAITS AFTER", traits, nonce)
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

export function buildExt (
        postInteraction = '0x',
    hashlock
) {
    const allInteractions = [
        postInteraction,
    ];

    const allInteractionsConcat = allInteractions.map((x) => x.slice(2)).join('')

    const cumulativeSum = (sum => value => { sum += value; return sum; })(0);
    const offsets = allInteractions
        .map(a => a.length / 2 - 1)
        .map(cumulativeSum)
        .reduce((acc, a, i) => acc + (BigInt(a) << BigInt(32 * i)), 0n);

    let extension: any = '0x';
    if (allInteractionsConcat.length > 0) {
        extension += offsets.toString(16).padStart(64, '0') + allInteractionsConcat;
    }
    extension = "0x0000010f0000004a0000004a0000004a0000004a000000250000000000000000"+postInteraction.slice(2)+"00000000000000688c9d28000078000000"+postInteraction.slice(2)+"00000000000000688c9d28000078000000"+postInteraction.slice(2)+"00000000502ea634d146790ca4a6000008"+hashlock.slice(2)+"0000000000000000000000000000000000000000000000000000000000002105000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000038d7ea4c68000000000000000000000038d7ea4c680000000000000000065000000640000000a0000007a00000079000000780000000a"

    let salt = 1n;
    if ((extension).length > 2) {
        salt = BigInt(keccak256(extension)) & ((1n << 160n) - 1n); // Use 160 bit of extension hash
    }


    return {
        salt,
        extension,
    };
}