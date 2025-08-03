import React from 'react'

export default function ErrorModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center">
      <div className="relative w-[90%] max-w-md bg-black border border-gray-700 rounded-2xl p-6 text-white glow-effect space-y-6 shadow-lg">
        {/* Animated background */}
        <div className="absolute inset-0 stars-bg animate-move-stars z-0 rounded-2xl pointer-events-none" />

        {/* Modal Content */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-xl font-semibold text-center">{'Error'}</h2>

          <p className="text-sm text-gray-300 whitespace-pre-wrap">You must connect and sign in to both Sui and Ethereum wallets. Both must be on testnet (sepolia and sui testnet)</p>


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
  )
}
