import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },

  // Static SPA mode for Firebase Hosting
  ssr: false,

  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/styles/main.scss',
  ],

  modules: [
    '@pinia/nuxt',
    'vuetify-nuxt-module',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  pinia: {
    storesDirs: ['./stores/**'],
  },

  vuetify: {
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi',
      },
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#1976D2',
              'primary-lighten-5': '#E3F2FD',
              'primary-lighten-4': '#BBDEFB',
              secondary: '#424242',
              accent: '#82B1FF',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FFC107',
              background: '#FAFAFA',
              surface: '#FFFFFF',
              'surface-variant': '#F5F5F5',
              border: '#E0E0E0',
              'on-background': '#212121',
              'on-surface': '#212121',
              // Role colors for light theme
              'role-be': '#1565C0',
              'role-be-bg': '#E3F2FD',
              'role-fe': '#2E7D32',
              'role-fe-bg': '#E8F5E9',
              'role-mobile': '#E65100',
              'role-mobile-bg': '#FFF3E0',
              'role-qa': '#7B1FA2',
              'role-qa-bg': '#F3E5F5',
              // Special state colors
              carryover: '#FF8F00',
              'carryover-bg': '#FFFDE7',
              overallocated: '#F44336',
              'overallocated-bg': '#FFEBEE',
            },
          },
          dark: {
            dark: true,
            colors: {
              primary: '#64B5F6',
              'primary-lighten-5': '#1E3A5F',
              'primary-lighten-4': '#0D47A1',
              secondary: '#9E9E9E',
              accent: '#82B1FF',
              error: '#CF6679',
              info: '#64B5F6',
              success: '#81C784',
              warning: '#FFD54F',
              background: '#121212',
              surface: '#1E1E1E',
              'surface-variant': '#2D2D2D',
              border: '#424242',
              'on-background': '#FFFFFF',
              'on-surface': '#FFFFFF',
              // Role colors for dark theme
              'role-be': '#BBDEFB',
              'role-be-bg': '#0D47A1',
              'role-fe': '#C8E6C9',
              'role-fe-bg': '#1B5E20',
              'role-mobile': '#FFE0B2',
              'role-mobile-bg': '#E65100',
              'role-qa': '#E1BEE7',
              'role-qa-bg': '#4A148C',
              // Special state colors
              carryover: '#FFD54F',
              'carryover-bg': '#3D3D00',
              overallocated: '#CF6679',
              'overallocated-bg': '#3D1F1F',
            },
          },
        },
      },
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  app: {
    head: {
      title: 'Capest Planner - Capacity Planning',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Team capacity planning application' },
      ],
    },
  },
})
