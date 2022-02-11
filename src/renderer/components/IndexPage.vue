<template>
<div>
  <div id="container">
    <div id="question-navbar">
      <b-btn v-show="userId==='guest'" v-b-modal.loginModal class="btn navbar-btn">{{ $t("index.login") }}</b-btn>
      <b-btn v-show="userId!=='guest'" @click="clearUserId" class="btn navbar-btn">{{ $t("index.logout") }}</b-btn>
      <b-btn v-b-modal.preferenceModal class="btn navbar-btn">{{ $t("index.preferences") }}</b-btn>
    </div>
    <div id='index-content'>
      <b-alert :show="showAlert" variant="danger" v-html="$t('index.eyeTrackerIsNotConnected')"></b-alert>
      <div id='introduction'>
        <h3>{{ $t("index.introductionHeader") }}</h3>
        <p v-html="$t('index.introduction')"></p>
      </div>
      <ul>
        <directory-item v-for="(m, i) in fileDict.children" :key="i" :model="m"></directory-item>
      </ul>
    </div>
  </div>
  <b-modal id="loginModal" centered ref="loginModal" :title="$t('index.loginMessage')" @ok="handleLogin" @shown="cancelLogin">
    <form @submit.stop.prevent="handleSubmit">
      <b-form-input type="text" placeholder="user00" v-model="userIdInModal"></b-form-input>
    </form>
  </b-modal>
  <b-modal id="preferenceModal" centered ref="preferenceModal" :title="$t('index.preferences')" @ok="updatePreference">
    <b-form-group label="Language">
      <b-form-radio-group v-model="selected.language" :options="options.language" name="language">
      </b-form-radio-group>
    </b-form-group>
    <b-form-group label="Eye tracker">
      <b-form-radio-group v-model="selected.eyeTracker" :options="options.eyeTracker" name="eyeTracker">
      </b-form-radio-group>
    </b-form-group>
    <b-form-group label="Labeling frequency">
      <b-form-radio-group v-model="selected.labelingFrequency" :options="options.labelingFrequency" name="labelingFrequency">
      </b-form-radio-group>
    </b-form-group>
    <b-form-group label="Gaze plot (an experimental option in iQL)">
      <b-form-radio-group v-model="selected.gazePlot" :options="options.gazePlot" name="gazePlot">
      </b-form-radio-group>
    </b-form-group>
  </b-modal>
</div>
</template>

<script>
  import DirectoryItem from './DirectoryItem'

  import fs from 'fs'
  import path from 'path'
  import Store from 'electron-store'
  const electronStore = new Store()

  function walk (p, callback) {
    var results = []
    fs.readdir(p, function (err, files) {
      if (err) {
        throw err
      }
      var pending = files.length
      if (!pending) {
        return callback(null, results)
      }
      files.map(function (file) {
        return path.join(p, file)
      }).filter(function (file) {
        if (fs.statSync(file).isDirectory()) {
          walk(file, function (err, res) {
            console.log(err)
            results.push({name: path.basename(file), children: res})
            if (!--pending) {
              callback(null, results)
            }
          })
        }
        return fs.statSync(file).isFile()
      }).forEach(function (file) {
        if (path.parse(file).ext.toLowerCase() === '.csv' || path.parse(file).ext.toLowerCase() === '.tsv') {
          results.push({
            path: file,
            name: path.parse(file).name
          })
        }
        if (!--pending) {
          callback(null, results)
        }
      })
    })
  }

  export default {
    components: {
      DirectoryItem
    },
    data () {
      return {
        fileDict: {},
        showAlert: false,
        userIdInModal: '',
        userId: this.$store.state.Result.userId,
        selected: {
          language: electronStore.get('language'),
          eyeTracker: electronStore.get('eyeTracker'),
          labelingFrequency: electronStore.get('labelingFrequency'),
          gazePlot: electronStore.get('gazePlot')
        },
        options: {
          language: [
            { text: 'English', value: 'en' },
            { text: 'Japanese', value: 'ja' },
            { text: 'German', value: 'de' }
          ],
          eyeTracker: [
            { text: 'Tobii Pro', value: 'pro' },
            { text: 'Tobii 4C', value: '4c' }
          ],
          labelingFrequency: [
            { text: 'Every time', value: 'every' },
            { text: 'Once in five times', value: 'some' },
            { text: 'Never', value: 'never' }
          ],
          gazePlot: [
            { text: 'On', value: true },
            { text: 'Off', value: false }
          ]
        }
      }
    },
    created () {
      this.$store.commit('RESET_RESULTS')
      const dirQuestions = path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], 'CREST_ES Dropbox', 'coala', 'questions')
      walk(dirQuestions, function (error, results) {
        if (error) throw error
        this.fileDict = {name: 'root', children: results}
      }.bind(this))
      const connectUrl = (electronStore.get('eyeTracker') === 'pro')
        ? 'http://localhost:8765/tobii_pro/connect'
        : 'http://localhost:8765/tobii_4c/connect'
      this.$http({
        method: 'get',
        url: connectUrl
      }).then(function (response) {
        if (response.data.response !== 'succeeded') {
          console.log(response.data.response)
          this.showAlert = true
        }
      }.bind(this)).catch(function (error) {
        console.log(error)
        this.showAlert = true
      }.bind(this))
      const connectUrl2 = 'http://localhost:8765/cursor/connect'
      this.$http({
        method: 'get',
        url: connectUrl2
      })

      // try {
      const connectUrl3 = 'http://localhost:8765/camera/disconnect'
      this.$http({
        method: 'get',
        url: connectUrl3
      }).then(res => {
        this.$http({
          method: 'get',
          url: 'http://localhost:8765/camera/connect'
        })
      })
      // } catch (err) {
      //   console.log(err.response.status)
      // }

      // const connectUrl4 = 'http://localhost:8765/camera/connect'
      // this.$http({
      //   method: 'get',
      //   url: connectUrl4
      // })
    },
    methods: {
      handleLogin (evt) {
        evt.preventDefault()
        if (!this.userIdInModal) {
          alert(this.$t('index.loginMessage'))
        } else {
          this.handleSubmit()
        }
      },
      handleSubmit () {
        this.userId = this.userIdInModal
        this.$store.commit('SET_USERID', {userId: this.userId})
        this.$refs.loginModal.hide()
      },
      clearUserId () {
        this.$store.commit('RESET_USERID')
        this.userId = 'guest'
      },
      cancelLogin () {
        this.userIdInModal = ''
      },
      updatePreference () {
        electronStore.set('language', this.selected.language)
        electronStore.set('eyeTracker', this.selected.eyeTracker)
        electronStore.set('labelingFrequency', this.selected.labelingFrequency)
        electronStore.set('gazePlot', this.selected.gazePlot)
        this.$i18n.locale = this.selected.language
      }
    }
  }
</script>

<style lang='scss'>
ul {
  list-style: none;
  margin-left: -20px;
  color: #123456;
}

#index-content {
  margin: 25px;
}

.modal {
  font-size: 16px;
}
</style>
