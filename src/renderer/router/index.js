import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: require('@/components/IndexPage').default
    },
    {
      path: '/question/:fileName/:questionId',
      name: 'question',
      component: require('@/components/QuestionPage').default
    },
    {
      path: '/result/:fileName',
      name: 'result',
      component: require('@/components/ResultPage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
