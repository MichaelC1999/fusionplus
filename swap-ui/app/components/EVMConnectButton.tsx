'use client'

import React, { useState } from 'react'
import './StarryButton.css'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'

const EVMConnectButton: React.FC = () => {
  const [hovering, setHovering] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const { address, isConnected } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()

  const handleClick = async () => {
    console.log(address)
    if (connecting) return
    setConnecting(true)

    try {
      if (isConnected) {
        await disconnectAsync()
      } else {
        const connector = connectors.find((c) => c.id === 'injected')
        if (!connector) throw new Error('Injected connector not found')
        await connectAsync({ connector })
      }
    } catch (err) {
      console.error('Error connecting or signing:', err)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <button
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleClick}
      className='relative overflow-hidden bg-black text-white w-[180px] h-[50px] rounded-lg glow-effect hover:scale-110 transition-transform duration-250'
    >
      <span className='absolute inset-0 flex items-center justify-center z-10'>
        EVM 
        {hovering && isConnected
          ? ' Disconnect'
          : isConnected
          ? ' 0x...' + address?.slice(34)
          : ' Connect'}
      </span>
      <div className='absolute inset-0 bg-black stars-bg animate-move-stars z-0'></div>
    </button>
  )
}

export default EVMConnectButton
