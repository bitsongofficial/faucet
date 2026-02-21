export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  return {
    amount: String(config.amount),
    denom: String(config.denom),
  }
})
