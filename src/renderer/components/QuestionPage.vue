<template>
  <div>
    <div id="container">
      <div id="question-navbar">
        <div class="row">
          <!-- <div class="col-sm-2">
          <router-link
            :to="{name: 'index', params: {}}"
            tag="button" class="btn navbar-btn">{{ $t("common.menu") }}</router-link>
          </div> -->
          <div class="col-sm-8">
            <b-progress :value="$route.params.questionId + 1" show-value :max="questions.length" height="30px" variant="info" class="navbar-progress"></b-progress>
          </div>
          <div class="col-sm-2">
          <router-link
            :to="{name: 'result', params: {fileName: $route.params.fileName}}"
            tag="button" class="btn navbar-btn">{{ $t("common.mark") }}</router-link>
          </div>
        </div>
      </div>
      <div id="text-container">
        <div id="text-header">
          {{ questions[$route.params.questionId].direction }}
        </div>
        <div id="text-content">
          <span v-html="questions[$route.params.questionId].text"></span>
        </div>
      </div>
      <div class="row" id="choices-container">
        <div v-for="(c, i) in questions[$route.params.questionId].choices" :key="i" class="col-md-12 choice-container">
          <div class="row">
            <Input type="radio" name="Question" @click="selectChoice(i)" :class="{selected: isSelected(i)}" class="col-md-1 btn choice-btn"></Input>
            <div class="col-md-11">{{ c }}</div>
          </div>
        </div>
        <!-- <div id="skip-container" class="col-md-6 choice-container">
          <button @click="selectSkip(1000)" :class="{selected: isSelected(i)}" class="btn choice-btn">{{ "この中に解答はない" }}</button>
        </div> -->
      </div>
    </div>
    <b-modal id="labelModal" hide-footer no-fade centered ref="labelModal" :title="$t('question.labelModalTitle')">
      <button @click="selectLabel(1)" class="btn label-button">{{ 1 }}</button>
      <button @click="selectLabel(2)" class="btn label-button">{{ 2 }}</button>
      <button @click="selectLabel(3)" class="btn label-button">{{ 3 }}</button>
      <button @click="selectLabel(4)" class="btn label-button">{{ 4 }}</button>
      <button @click="selectLabel(5)" class="btn label-button">{{ 5 }}</button>
    </b-modal>
  </div>
</template>

<script>
  import Papa from 'papaparse'
  import fs from 'fs'
  import Store from 'electron-store'
  const electronStore = new Store()

  export default {
    data () {
      return {
        questions: [],
        results: this.$store.state.Result.results,
        userId: this.$store.state.Result.userId
      }
    },
    created () {
      const csv = fs.readFileSync(this.$route.params.fileName, 'utf-8')
      this.$store.commit('SET_PROBPATH', this.$route.params.fileName)
      const questions = Papa.parse(csv, {header: true, skipEmptyLines: true})['data']
      for (const q of questions) {
        this.questions.push({
          id: q['id'],
          text: q['text'],
          direction: q['direction'] ? q['direction'] : this.$t('question.textHeader'),
          choices: [q['choice_1'], q['choice_2'], q['choice_3'], q['choice_4']],
          answer: q['answer'] - 1 // starting at 0
        })
      }
      // 引数でuser名を追加
      this.$http({
        method: 'get',
        url: 'http://localhost:8765/recording/start?uid=' + this.$store.state.Result.userId
      })
    },
    beforeRouteLeave (to, from, next) {
      this.$http({
        method: 'get',
        url: 'http://localhost:8765/recording/stop'
      }).then(function (response) {
        next()
      }).catch(function (error) {
        console.log(error)
        next()
      })
    },
    mounted () {
      this.startSolving()
    },
    methods: {
      currentProb () {
        const cp = this.$store.state.Result.currentProbPath.match(/\d-\d\d/)
        if (cp == null) {
          return ''
        }
        return cp[0]
      },
      selectChoice (choice) {
        const correctness = (choice === this.questions[this.$route.params.questionId].answer) ? 1 : 0
        this.$store.commit('SELECT_CHOICE', {
          id: this.uid,
          questionId: this.$route.params.questionId,
          choice: choice,
          correctness: correctness,
          confidence: 0 // tentative
        })
        this.$forceUpdate()
        this.$http({
          method: 'get',
          url: 'http://localhost:8765/recording/capture'
        })
        this.$http({
          method: 'post',
          url: 'http://localhost:8765/mcq_confidence/stop_solving',
          data: JSON.stringify({
            id: this.uid,
            answer: choice,
            correctness: correctness
          })
        }).then(function (response) {
          this.$store.commit('SELECT_CHOICE', {
            id: this.uid,
            questionId: this.$route.params.questionId,
            choice: choice,
            correctness: correctness,
            confidence: response.data.confidence
          })
          this.stopSolving()
        }.bind(this)).catch(function (error) {
          console.log(error)
          this.stopSolving()
        }.bind(this))
      },
      selectSkip (choice) {
        const correctness = (choice === this.questions[this.$route.params.questionId].answer) ? 1 : 0
        this.$store.commit('SELECT_CHOICE', {
          id: this.uid,
          questionId: this.$route.params.questionId,
          choice: choice,
          correctness: correctness,
          confidence: 0 // tentative
        })
        this.$forceUpdate()

        this.$http({
          method: 'get',
          url: 'http://localhost:8765/recording/capture'
        })
        this.$http({
          method: 'post',
          url: 'http://localhost:8765/mcq_confidence/stop_solving',
          data: JSON.stringify({
            id: this.uid,
            answer: choice,
            correctness: correctness
          })
        }).then(function (response) {
          this.$store.commit('SELECT_CHOICE', {
            id: this.uid,
            questionId: this.$route.params.questionId,
            choice: choice,
            correctness: correctness,
            confidence: response.data.confidence
          })
          this.stopSolving()
        }.bind(this)).catch(function (error) {
          console.log(error)
          this.stopSolving()
        }.bind(this))
      },
      isSolved (questionId) {
        if (this.$route.params.questionId === questionId) {
          return true
        }
        return (this.results[questionId] !== undefined)
      },
      isSelected (choice) {
        const result = this.results[this.$route.params.questionId]
        if (result === undefined) {
          return false
        }
        return (result.choice === choice)
      },
      selectLabel (choice) {
        this.$http({
          method: 'post',
          url: 'http://localhost:8765/mcq_confidence/label',
          data: JSON.stringify({
            id: this.uid,
            confidence: choice
          })
        }).then(function (response) {
          this.$refs.labelModal.hide()
          this.openNextQuestion()
        }.bind(this)).catch(function (error) {
          console.log(error)
          this.$refs.labelModal.hide()
          this.openNextQuestion()
        }.bind(this))
      },
      stopSolving () {
        switch (electronStore.get('labelingFrequency')) {
          case 'every':
            this.$refs.labelModal.show()
            break
          case 'some':
            if (Math.random() < 0.2) {
              this.$refs.labelModal.show()
            } else {
              this.openNextQuestion()
            }
            break
          default:
            // includes 'never'
            this.openNextQuestion()
        }
      },
      openNextQuestion () {
        if (this.$route.params.questionId === this.questions.length - 1) {
          this.$router.push({name: 'result', params: {fileName: this.$route.params.fileName}})
        } else {
          this.$router.push({name: 'question', params: {fileName: this.$route.params.fileName, questionId: this.$route.params.questionId + 1}})
          this.startSolving()
        }
      },
      startSolving () {
        this.uid = Date.now()
        const tDom = document.getElementById('text-container')
        const tArea = [
          tDom.getBoundingClientRect().left,
          tDom.getBoundingClientRect().top,
          tDom.getBoundingClientRect().width,
          tDom.getBoundingClientRect().height
        ]
        var cAreas = []
        Array.prototype.forEach.call(document.getElementsByClassName('choice-container'), function (cDom) {
          cAreas.push([
            cDom.getBoundingClientRect().left,
            cDom.getBoundingClientRect().top,
            cDom.getBoundingClientRect().width,
            cDom.getBoundingClientRect().height
          ])
        })

        this.$http({
          method: 'post',
          url: 'http://localhost:8765/mcq_confidence/start_solving',
          data: JSON.stringify({
            id: this.uid,
            user_id: this.userId,
            document_id: this.$route.params.fileName,
            question_id: this.$route.params.questionId,
            text_area: tArea,
            choice_areas: cAreas
          })
        })
      }
    }
  }
</script>

<style lang="scss">
#text-header {
  margin: 25px;
  padding-left: 30px;
}

#text-content {
  margin: 25px;
  min-height: 100px;
  font-size: 30px;
  padding-left: 30px;
}

#choices-container {
  margin: 20px;
}

#skip-container {
  // margin: 10px;
  margin: 0 auto;
  // text-align: center;
}

#headerprobid {
	text-align: left;
  font-style: italic;
}

.choice-container {
  text-align: left;
  font-size: 30px;
  padding: 10px;
}

.coalaButton {
  background-color: transparent;
  border: 2px solid;
  color: darken($gray, 50%);
  border-color: darken($gray, 50%);
  &:hover{
    background-color: darken($gray, 50%);
    color: $white;
  }
}

.choice-btn {
  @extend .coalaButton;
  width: 0px;
  top: 15px;
  bottom: 15px;
  left: 30px;
  min-height: 30px;
  &.selected {
    background-color: darken($gray, 50%);
    color: $white;
  }
}

.choice-btn:focus{
  outline: 4px solid $white;
}

.label-button {
  @extend .coalaButton;
  width: 17%;
  padding-top: 20px;
  padding-bottom: 20px;
  margin: 20px 5px 20px 5px;
}

#labelModal {
  text-align: center;
}

.navbar-progress {
  margin: 10px;
}
</style>
