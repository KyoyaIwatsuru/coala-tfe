import Vue from 'vue'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import BootstrapVue from 'bootstrap-vue'
import VueProgressiveImage from 'vue-progressive-image'
import VueI18n from 'vue-i18n'
import Store from 'electron-store'

import App from './App'
import router from './router'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(VueProgressiveImage)

const electronStore = new Store()
if (typeof electronStore.get('language') === 'undefined') {
  electronStore.set('language', 'en')
  electronStore.set('eyeTracker', 'pro')
  electronStore.set('labelingFrequency', 'never')
  electronStore.set('gazePlot', false)
}

const message = require('./message.json')
Vue.use(VueI18n)
const i18n = new VueI18n({
  locale: electronStore.get('language'),
  messages: message
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  i18n: i18n,
  template: '<App/>'
}).$mount('#app')
