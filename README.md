# BitSong Faucet

A testnet faucet for BitSong (or any Cosmos SDK chain). Built with Nuxt 4, it provides both a web UI and a REST API to request testnet tokens.

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NUXT_MNEMONIC` | Faucet wallet mnemonic |
| `NUXT_RPC_ENDPOINT` | Chain RPC endpoint |
| `NUXT_BECH32_PREFIX` | Address prefix (e.g. `bitsong`) |
| `NUXT_GAS_PRICE` | Gas price (e.g. `0.025ubtsg`) |
| `NUXT_COIN_TYPE` | HD derivation coin type (default `118`) |
| `NUXT_DENOM` | Token denom (e.g. `ubtsg`) |
| `NUXT_AMOUNT` | Amount per request in smallest unit (e.g. `10000000`) |

## Development

```bash
pnpm dev
```

Open http://localhost:3000

## Production

```bash
pnpm build
node .output/server/index.mjs
```

## API

### Request tokens

```
POST /api/v1/faucet
Content-Type: application/json

{ "address": "bitsong1..." }
```

Returns `{ "runId": "...", "amount": "...", "denom": "..." }`

### Poll status

```
GET /api/v1/faucet/status/{runId}
```

Poll every ~2s. Returns `{ "status": "running" | "completed" | "failed", "result": { "transactionHash": "..." } }`

### Get config

```
GET /api/v1/config
```

Returns `{ "amount": "...", "denom": "..." }`

## License

MIT
