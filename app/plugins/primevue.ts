import PrimeVue from 'primevue/config'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(PrimeVue, {
    unstyled: true,
    ripple: false,
    pt: {
      button: { root: 'ui-button' },
      textarea: { root: 'ui-textarea' },
      radiobutton: {
        root: 'ui-radio',
        input: 'ui-radio-input',
        box: 'ui-radio-box',
        icon: 'ui-radio-dot',
      },
    },
  })
})
