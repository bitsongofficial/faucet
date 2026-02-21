<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Loader2, Terminal, Bot, Copy, Check } from 'lucide-vue-next'
import BigNumber from 'bignumber.js'

const address = ref('')
const polling = ref(false)

const { data: configData } = useFetch('/api/v1/config')

const displayAmount = computed(() => {
  if (!configData.value?.amount) return ''
  return new BigNumber(configData.value.amount).dividedBy(new BigNumber(10).pow(6)).toFixed()
})

const displayDenom = computed(() => {
  if (!configData.value?.denom) return 'Tokens'
  const denom = configData.value.denom
  const name = denom.startsWith('u') ? denom.slice(1) : denom
  return name.toUpperCase()
})

const baseUrl = computed(() => {
  if (import.meta.server) return ''
  return window.location.origin
})

const { copy, copied } = useClipboard()
const copiedId = ref<string | null>(null)

function copyToClipboard(text: string, id: string) {
  copy(text)
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

const curlRequest = computed(() =>
  `curl -X POST ${baseUrl.value}/api/v1/faucet \\\n  -H "Content-Type: application/json" \\\n  -d '{"address": "bitsong1..."}'`,
)

const curlPoll = computed(() =>
  `curl ${baseUrl.value}/api/v1/faucet/status/<runId>`,
)


const { data: faucetData, error: faucetError, execute: submitFaucet, status } = useFetch('/api/v1/faucet', {
  method: 'POST',
  body: computed(() => ({ address: address.value.trim() })),
  immediate: false,
  watch: false,
})

const loading = computed(() => status.value === 'pending' || polling.value)

async function pollStatus(runId: string) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const res = await $fetch<{ status: string, result?: { transactionHash: string }, error?: string }>(
      `/api/v1/faucet/status/${runId}`,
    )

    if (res.status === 'completed') return res
    if (res.status === 'failed') throw new Error(res.error || 'Transaction failed')
  }

  throw new Error('Request timed out')
}

async function requestTokens() {
  if (!address.value.trim()) {
    toast.error('Please enter a wallet address')
    return
  }

  try {
    await submitFaucet()

    if (faucetError.value) {
      toast.error('Faucet request failed', {
        description: faucetError.value.data?.statusMessage || faucetError.value.message,
      })
      return
    }

    polling.value = true
    const result = await pollStatus(faucetData.value!.runId)
    toast.success('Tokens sent!', {
      description: `TX: ${result.result?.transactionHash}`,
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    toast.error('Faucet request failed', { description: message })
  }
  finally {
    polling.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-16">
    <div class="w-full max-w-xl space-y-6">
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-2xl font-bold">
            BitSong Faucet
          </CardTitle>
          <CardDescription>
            Get testnet tokens sent to your wallet
          </CardDescription>
        </CardHeader>

        <form class="contents" @submit.prevent="requestTokens">
          <CardContent>
            <div class="space-y-2">
              <Label for="address">Wallet Address</Label>
              <Input
                id="address"
                v-model="address"
                placeholder="bitsong1..."
                :disabled="loading"
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" class="w-full" :disabled="loading">
              <Loader2 v-if="loading" class="animate-spin" />
              {{ loading ? 'Requesting...' : `Request ${displayAmount} ${displayDenom}` }}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-semibold">
            API / AI Agents
          </CardTitle>
          <CardDescription>
            Request tokens with cURL
          </CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <Tabs default-value="curl">
            <TabsList class="w-full">
              <TabsTrigger value="curl" class="flex-1 gap-1.5">
                <Terminal class="size-3.5" />
                cURL
              </TabsTrigger>
              <TabsTrigger value="agents" class="flex-1 gap-1.5">
                <Bot class="size-3.5" />
                AI Agents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curl" class="mt-4 space-y-3">
              <p class="text-sm text-muted-foreground">
                1. Request tokens
              </p>
              <div class="group relative">
                <pre class="overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>{{ curlRequest }}</code></pre>
                <Button
                  variant="ghost"
                  size="icon"
                  class="absolute right-1.5 top-1.5 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                  @click="copyToClipboard(curlRequest, 'curl-1')"
                >
                  <Check v-if="copiedId === 'curl-1'" class="size-3" />
                  <Copy v-else class="size-3" />
                </Button>
              </div>

              <p class="text-sm text-muted-foreground">
                2. Poll status with the returned <code class="rounded bg-muted px-1 py-0.5 text-xs">runId</code>
              </p>
              <div class="group relative">
                <pre class="overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>{{ curlPoll }}</code></pre>
                <Button
                  variant="ghost"
                  size="icon"
                  class="absolute right-1.5 top-1.5 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                  @click="copyToClipboard(curlPoll, 'curl-2')"
                >
                  <Check v-if="copiedId === 'curl-2'" class="size-3" />
                  <Copy v-else class="size-3" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="agents" class="mt-4 space-y-3">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">POST</span>
                  <code class="text-xs text-foreground">{{ baseUrl }}/api/v1/faucet</code>
                </div>
                <div class="rounded-lg bg-muted p-3 text-xs">
                  <p class="mb-1 text-muted-foreground">Request</p>
                  <code>Content-Type: application/json</code>
                  <pre class="mt-1"><code>{ "address": "bitsong1..." }</code></pre>
                  <Separator class="my-2" />
                  <p class="mb-1 text-muted-foreground">Response</p>
                  <pre><code>{ "runId": "...", "amount": "...", "denom": "..." }</code></pre>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">GET</span>
                  <code class="text-xs text-foreground">{{ baseUrl }}/api/v1/faucet/status/{runId}</code>
                </div>
                <div class="rounded-lg bg-muted p-3 text-xs">
                  <p class="mb-1 text-muted-foreground">Poll every 2s until status is final</p>
                  <pre><code>{ "status": "completed", "result": { "transactionHash": "..." } }</code></pre>
                  <div class="mt-2 flex gap-2">
                    <span class="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">running</span>
                    <span class="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">completed</span>
                    <span class="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">failed</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">GET</span>
                  <code class="text-xs text-foreground">{{ baseUrl }}/api/v1/config</code>
                </div>
                <div class="rounded-lg bg-muted p-3 text-xs">
                  <pre><code>{ "amount": "{{ configData?.amount }}", "denom": "{{ configData?.denom }}" }</code></pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
