import { SigningStargateClient, GasPrice } from '@cosmjs/stargate'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { stringToPath } from '@cosmjs/crypto'

export interface CosmosConfig {
  mnemonic: string
  rpcEndpoint: string
  bech32Prefix: string
  gasPrice: string
  coinType: string
}

let clientPromise: Promise<{
  client: SigningStargateClient
  senderAddress: string
}> | null = null

function init(config: CosmosConfig) {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { mnemonic, rpcEndpoint, bech32Prefix, gasPrice, coinType } = config

      if (!mnemonic) throw new Error('mnemonic runtime config is required')
      if (!rpcEndpoint) throw new Error('rpcEndpoint runtime config is required')
      if (!bech32Prefix) throw new Error('bech32Prefix runtime config is required')
      if (!gasPrice) throw new Error('gasPrice runtime config is required')

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

      return { client, senderAddress: accounts[0].address }
    })()
  }
  return clientPromise
}

export async function getSigningClient(config: CosmosConfig): Promise<SigningStargateClient> {
  const { client } = await init(config)
  return client
}

export async function getSenderAddress(config: CosmosConfig): Promise<string> {
  const { senderAddress } = await init(config)
  return senderAddress
}
