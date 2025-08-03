import React, { useState } from 'react';

const LABELS = {
  evmDeposit: 'EVM Deposit',
  suiDeposit: 'Sui Deposit',
  evmWithdraw: 'EVM Withdrawal',
  suiWithdraw: 'Sui Withdrawal',
  secret: "Escrow Secret"
};

const isValid = (val: string): boolean =>
  (!!val &&
  val !== '0x0000000000000000000000000000000000000000' &&
  val !== '0x0000000000000000000000000000000000000000000000000000000000000000');

const shorten = (str: string): string => str.slice(0, 6) + '...' + str.slice(str.length - 6);

const getExplorerLink = (key: string, val: string): string | null => {
  if (!isValid(val)) return null;

  const evmKeys = ['evmDeposit', 'evmWithdraw', 'evmEscrow'];
  const suiKeys = ['suiDeposit', 'suiWithdraw', 'suiEscrow'];

  if (evmKeys.includes(key)) {
    return `https://sepolia.etherscan.io/${val.length < 50 ? 'address' : 'tx'}/${val}`;
  }
  if (suiKeys.includes(key)) {
    return `https://suiscan.xyz/testnet/${val.length < 50 ? 'tx' : 'object'}/${val}`;
  }
  return null;
};

export default function Modal({ isOpen, isSuiSource, orderStatus, onClose, title,secret, parties, amounts }: any) {
  if (!isOpen) return null;

  const [showOrderInit, setShowOrderInit] = useState(false);

  const evmDepoRow = (
    <div className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2">
      <span>
        {LABELS.evmDeposit}:{' '}
        {isValid(orderStatus?.evmEscrow) && (
          <a
            href={getExplorerLink('evmEscrow', orderStatus.evmEscrow)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            {shorten(orderStatus?.evmEscrow)}
          </a>
        )}
      </span>
      {isValid(orderStatus?.evmDeposit) ? (
        <code className="truncate text-green-400">
          <a
            href={getExplorerLink('evmDeposit', orderStatus.evmDeposit)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            TX: {shorten(orderStatus?.evmDeposit)}
          </a>
        </code>
      ) : (
        <span className="italic text-yellow-400 animate-pulse">Waiting for escrow creation...</span>
      )}
    </div>
  );

  const suiDepoRow = (
    <div className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2">
      <span>
        {LABELS.suiDeposit}:{' '}
        {isValid(orderStatus?.suiEscrow) && (
          <a
            href={getExplorerLink('suiEscrow', orderStatus.suiEscrow)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            {shorten(orderStatus?.suiEscrow)}
          </a>
        )}
      </span>
      {isValid(orderStatus?.suiDeposit) ? (
        <code className="truncate text-green-400">
          <a
            href={getExplorerLink('suiDeposit', orderStatus.suiDeposit)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            TX: {shorten(orderStatus?.suiDeposit)}
          </a>
        </code>
      ) : (
        <span className="italic text-yellow-400 animate-pulse">Waiting for escrow creation...</span>
      )}
    </div>
  );

  const evmWitRow = (
    <div className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2">
      <span>{LABELS.evmWithdraw}:</span>
      {isValid(orderStatus?.evmDeposit) && !isValid(orderStatus?.evmWithdraw) ? (
        <span className="italic text-yellow-400 animate-pulse">Pending withdrawal...</span>
      ) : isValid(orderStatus?.evmWithdraw) ? (
        <code className="truncate text-green-400">
          <a
            href={getExplorerLink('evmWithdraw', orderStatus.evmWithdraw)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            TX: {shorten(orderStatus?.evmWithdraw)}
          </a>
        </code>
      ) : (
        <span className="text-gray-500 italic">—</span>
      )}
    </div>
  );

  const suiWitRow = (
    <div className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2">
      <span>{LABELS.suiWithdraw}:</span>
      {isValid(orderStatus?.suiDeposit) && !isValid(orderStatus?.suiWithdraw) ? (
        <span className="italic text-yellow-400 animate-pulse">Pending withdrawal...</span>
      ) : isValid(orderStatus?.suiWithdraw) ? (
        <code className="truncate text-green-400">
          <a
            href={getExplorerLink('suiWithdraw', orderStatus.suiWithdraw)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-green-400 underline hover:text-white transition-colors duration-150"
          >
            TX: {shorten(orderStatus?.suiWithdraw)}
          </a>
        </code>
      ) : (
        <span className="text-gray-500 italic">—</span>
      )}
    </div>
  );

  const secretRow = (
    <div className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2">
      <span>{LABELS.secret}: {secret}</span>
      {isValid(orderStatus?.suiDeposit) || isValid(orderStatus?.evmDeposit) ? (
        <code className="truncate text-green-400">
          Sent to Resolvers
        </code>
      ) : (
        <span className="text-gray-500 italic">—</span>
      )}
    </div>
  );

  const balanceChanges = <div className="space-y-4 pt-2 relative z-10">
  <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">
    Participants & Allocations
  </h3>
  {Object.entries(parties).map(([label, address]) => {
    const isEvm= label.includes('EVM')
    const isMaker = label.includes('Maker')
    let color = 'text-red-400'
    let netGain = '-'
    console.log(label, address, isMaker, isEvm, isSuiSource)

    if (isMaker && isEvm && isSuiSource ||
    !isMaker && isEvm &&!isSuiSource||
    isMaker && !isEvm && !isSuiSource||
    !isMaker && !isEvm && isSuiSource) {
      netGain = '+'
      color =  'text-green-400' 
    }


    const amount = isEvm ? amounts.ethUSDTAmount : amounts.suiUSDTAmount;

    return (
      <div
        key={label}
        className="flex items-center justify-between text-sm text-gray-300 border-b border-gray-800 pb-2"
      >
        <span>{label}:</span>
        <div className="flex flex-col items-end">
          <span className="truncate">{shorten(address)}</span>
          <span className={`${color} text-xs font-mono`}>{netGain}{amount} USDT</span>
        </div>
      </div>
    );
  })}
</div>



  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center">
      <div className="relative w-[90%] max-w-2xl bg-black border border-gray-700 rounded-2xl p-6 text-white glow-effect space-y-6 shadow-lg">
        {/* Title */}
        <h2 className="text-xl font-semibold text-center">{title}</h2>

        {/* Status Rows */}
        <div className="space-y-4 pt-2 relative z-10">
          <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Transaction Status</h3>
          {isSuiSource ? (
            <>
              {suiDepoRow}
              {evmDepoRow}
              {secretRow}
              {suiWitRow}
              {evmWitRow}
            </>
          ) : (
            <>
              {evmDepoRow}
              {suiDepoRow}
              {secretRow}
              {evmWitRow}
              {suiWitRow}
            </>
          )}
        </div>

        {/* Order Init Toggle + JSON */}
        <div className="relative z-10 space-y-4">

          {balanceChanges}
          {/* Close Button */}
          <div className="w-full flex justify-center pt-2">
            <button
              onClick={onClose}
              className="relative overflow-hidden bg-black text-white w-[160px] h-[45px] rounded-lg glow-effect hover:scale-105 transition-transform duration-200"
            >
              <span className="absolute inset-0 flex items-center justify-center z-10">Close</span>
              <div className="absolute inset-0 bg-black stars-bg animate-move-stars z-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
