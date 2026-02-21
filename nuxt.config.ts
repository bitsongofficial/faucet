import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-02-20',
  devtools: { enabled: true },
  modules: ['workflow/nuxt', 'shadcn-nuxt', '@vueuse/nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    mnemonic: '',
    rpcEndpoint: '',
    bech32Prefix: '',
    gasPrice: '',
    coinType: '118',
    denom: '',
    amount: '',
  },
  hooks: {
    'nitro:config'(config) {
      config.moduleSideEffects = config.moduleSideEffects || []
      config.moduleSideEffects.push(config.buildDir + '/workflow')
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})