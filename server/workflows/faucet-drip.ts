import { FatalError } from 'workflow'

interface CosmosConfig {
  mnemonic: string
  rpcEndpoint: string
  bech32Prefix: string
  gasPrice: string
  coinType: string
}

export async function faucetDripWorkflow(
  recipientAddress: string,
  denom: string,
  amount: string,
  cosmosConfig: CosmosConfig,
) {
  'use workflow'

  const result = await sendTokens(recipientAddress, denom, amount, cosmosConfig)
  return result
}

async function sendTokens(
  recipientAddress: string,
  denom: string,
  amount: string,
  cosmosConfig: CosmosConfig,
) {
  'use step'

  try {
    const { SigningStargateClient, GasPrice } = await import('@cosmjs/stargate')
    const { DirectSecp256k1HdWallet } = await import('@cosmjs/proto-signing')
    const { stringToPath } = await import('@cosmjs/crypto')

    const { mnemonic, rpcEndpoint, bech32Prefix, gasPrice, coinType } = cosmosConfig
    const hdPath = stringToPath(`m/44'/${coinType || '118'}'/0'/0/0`)

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32Prefix,
      hdPaths: [hdPath],
    })

    const accounts = await wallet.getAccounts()
    if (!accounts[0]) throw new Error('No accounts derived from mnemonic')

    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      wallet,
      { gasPrice: GasPrice.fromString(gasPrice) },
    )

    const result = await client.sendTokens(
      accounts[0].address,
      recipientAddress,
      [{ denom: String(denom), amount: String(amount) }],
      'auto',
    )

    return {
      transactionHash: result.transactionHash,
      amount,
      denom,
      recipient: recipientAddress,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    throw new FatalError(`failed to send tokens: ${message}`)
  }
}
sendTokens.maxRetries = 0
