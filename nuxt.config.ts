// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false, // SPA Mode for instant mobile client state and zero hydration mismatch

  app: {
    head: {
      title: 'Raum-Tracking Smart Home',
      htmlAttrs: {
        lang: 'de',
      },
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#090d16' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Raum-Tracking' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><circle cx='12' cy='12' r='10' fill='%230f172a'/><path d='M12 3a9 9 0 0 0-9 9c0 2.4.9 4.6 2.4 6.2l1.4-1.4A6.9 6.9 0 0 1 5 12a7 7 0 1 1 14 0c0 1.9-.8 3.7-2.1 5l1.4 1.4A8.9 8.9 0 0 0 21 12a9 9 0 0 0-9-9zm0 4a5 5 0 0 0-5 5c0 1.4.6 2.6 1.5 3.5l1.4-1.4A3 3 0 0 1 9 12a3 3 0 1 1 6 0c0 .8-.3 1.6-.9 2.1l1.4 1.4A4.9 4.9 0 0 0 17 12a5 5 0 0 0-5-5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' fill='%2338bdf8'/></svg>",
        },
      ],
    },
  },

  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },

  nitro: {
    experimental: {
      openAPI: false,
    },
  },
})
