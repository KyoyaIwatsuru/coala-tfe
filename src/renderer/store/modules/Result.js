const state = {
  results: [],
  userId: 'guest',
  currentProbPath: ''
}

const mutations = {
  SELECT_CHOICE (state, payload) {
    state.results[payload.questionId] = {
      id: payload.id,
      choice: payload.choice,
      correctness: payload.correctness,
      confidence: payload.confidence
    }
  },
  RESET_RESULTS (state) {
    state.results = []
  },
  SET_USERID (state, payload) {
    state.userId = payload.userId
  },
  RESET_USERID (state) {
    state.userId = 'guest'
    state.currentProbPath = ''
  },
  SET_PROBPATH (state, path) {
    state.currentProbPath = path
  }
}

const actions = {
  someAsyncTask ({ commit }) {
    // do something async
    commit('SELECT_CHOICE')
    commit('RESET_RESULTS')
    commit('SET_USERID')
    commit('RESET_USERID')
    commit('SET_PROBPATH')
  }
}

export default {
  state,
  mutations,
  actions
}
