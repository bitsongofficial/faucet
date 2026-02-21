import { z } from 'zod'
import { start } from 'workflow/api'
import { fromBech32 } from '@cosmjs/encoding'
import { faucetDripWorkflow } from '~~/server/workflows/faucet-drip'

const bodySchema = z.object({
  address: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { address } = await readValidatedBody(event, bodySchema.parse)

  const prefix = config.bech32Prefix
  if (!prefix) {
    throw createError({
      statusCode: 500,
      statusMessage: 'bech32Prefix runtime config not configured',
    })
  }

  let decoded
  try {
    decoded = fromBech32(address)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid address: not a valid bech32 address',
    })
  }

  if (decoded.prefix !== prefix) {
    throw createError({
      statusCode: 400,
      statusMessage: `invalid address: must start with "${prefix}"`,
    })
  }

  const denom = String(config.denom)
  const amount = String(config.amount)
  if (!denom) {
    throw createError({
      statusCode: 500,
      statusMessage: 'denom runtime config not configured',
    })
  }

  if (!amount) {
    throw createError({
      statusCode: 500,
      statusMessage: 'amount runtime config not configured',
    })
  }

  const run = await start(faucetDripWorkflow, [address, denom, amount, {
    mnemonic: config.mnemonic,
    rpcEndpoint: config.rpcEndpoint,
    bech32Prefix: config.bech32Prefix,
    gasPrice: config.gasPrice,
    coinType: config.coinType,
  }])

  return {
    message: 'faucet request accepted',
    runId: run.runId,
    recipient: address,
    amount,
    denom,
  }
})
