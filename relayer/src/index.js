import express from 'express'
import evmRouter from './routes/evm'
import suiRouter from './routes/sui'

import cors from 'cors'

import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// mount routers
app.use('/evm', evmRouter)
app.use('/sui', suiRouter)


const PORT = process.env.PORT || 2000
app.listen(PORT, () => {
  console.log(`🚀 Fusion+ Relayer/Resolver backend listening on http://localhost:${PORT}`)
})