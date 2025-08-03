/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { getAdapter } from '../misc/adapter'
import SuiConnectButton from './SuiConnectButton'
import { WalletAccount } from '@mysten/wallet-standard'
import EVMConnectButton from './EVMConnectButton'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'

const StickyHeader: React.FC = () => {
  const [userAccount, setUserAccount] = React.useState<WalletAccount | undefined>()
    const { address: evmAddress, isConnected: evmIsConnected } = useAccount()
    const { signMessageAsync: evmSign } = useSignMessage()
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
  return (
    <header style={{zIndex: 99}} className='fixed top-0 left-0 w-full bg-opacity-50  p-6 z-10'>
      <div className='flex items-center justify-between'>
        <div>
          {/* <Image
            style={{ width: '200px', cursor: 'pointer' }}
            src={NightlyLogo}
            alt='logo'
            onClick={() => {
              // redirect to nightly.app
              window.location.href = 'https://nightly.app'
            }}
          /> */}
        </div>
        <div className='flex flex-col space-y-4'>
          <SuiConnectButton
            connected={userAccount?.address !== undefined}
            onConnect={async () => {
              const adapter = await getAdapter()
              try {
                await adapter.connect()
                const account = await adapter.getAccounts()
                if (account[0]) {
                  setUserAccount(account[0])
                }
              } catch (error) {
                // If error, disconnect ignore error
                await adapter.disconnect().catch(() => {})
              }
            }}
            onDisconnect={async () => {
              try {
                const adapter = await getAdapter()
                await adapter.disconnect()
                setUserAccount(undefined)
              } catch (error) {
                console.log(error)
              }
            }}
            publicKey={userAccount?.address}
          />

          <EVMConnectButton connected={evmIsConnected} onConnect={async () => {
            console.log("Connected EVM")
          }}
          onDisconnect={async () => {
            console.log("Disconnected EVM")
          }}/>
        </div>
      </div>
    </header>
  )
}

export default StickyHeader
