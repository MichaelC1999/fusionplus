import React from 'react'
import './StarryButton.css'
export interface StarryButtonProps {
  connected: boolean
  publicKey?: string
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}
const SuiConnectButton: React.FC<StarryButtonProps> = ({
  connected,
  onConnect,
  onDisconnect,
  publicKey,
}) => {
  const [connecting, setConnecting] = React.useState(false)
  const [hovering, setHovering] = React.useState(false)
  return (
    <button
    style={{zIndex: 99}}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={async () => {
        console.log(connecting, 1)
        if (connecting) return
        if (connected) {
          setConnecting(true)
          await onDisconnect()
          setConnecting(false)
        } else {
          setConnecting(true)
          await onConnect()
          setConnecting(false)
        }
      }}
      className=' relative overflow-hidden bg-black text-white w-[180px] h-[50px] rounded-lg glow-effect hover:scale-110 transition-transform duration-250'
    >
      <span className='absolute inset-0 flex items-center justify-center z-10'>
        Sui {hovering && connected ? 'Disconnect' : connected ? '0x...' + publicKey?.slice(58) : 'Connect'}
      </span>
      <div className='absolute inset-0 bg-black stars-bg animate-move-stars z-0'></div>
    </button>
  )
}

export default SuiConnectButton
