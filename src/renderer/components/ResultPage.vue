<template>
  <div>
    <div id="container">
      <div id="question-navbar">
        <span id="headerprobid">{{currentProb()}}</span>
        <router-link
          :to="{name: 'index', params: {}}"
          tag="button" class="btn navbar-btn">{{ $t("common.menu") }}</router-link>
      </div>
      <div>
        <!--<h3>{{ $t("index.introductionHeader") }}</h3> -->
        <h1 class="text-center">{{$t("index.end")}}</h1>
      </div>
      <div id="question-navbar">
        <span id="headerprobid">{{currentProb()}}</span>
        <router-link 
          :to="{ name: 'question', params: {fileName: nextProbPath, questionId: 0} }"
          tag="button" class="btn navbar-btn">{{ $t("result.nextProb") }}</router-link>
      </div>
      <!-- <div id="result-content">
        <table class="table">
           <template v-for="(q, i) in questions" v-if="i > 0"> 
          <template v-for="(q, i) in questions">
            <tr>
              <td align="left">Q{{ i+1 }}
                <span v-if="results[i] === undefined" class="red">【{{ $t("result.unsolved") }}】</span>
                <span v-else-if="results[i].correctness === 1" class="green">
                  【{{ $t("result.correct") }}】
                  <span v-if="results[i].confidence === 1">{{ $t("result.highConfidence") }}</span>
                  <span v-else-if="results[i].confidence === 0">{{ $t("result.lowConfidence") }} <i class="twa twa-cloud"></i></span> 
                </span>
                <span v-else class="red">
                  【{{ $t("result.incorrect") }}】
                  <span v-if="results[i].confidence === 1">{{ $t("result.highConfidence") }} <i class="twa twa-umbrella"></i></span>
                  <span v-else-if="results[i].confidence === 0">{{ $t("result.lowConfidence") }}</span> 
                </span>
              </td>
              <td align="right">
                <div v-if="results[i] !== undefined">
                  <b-btn v-b-toggle="'collapse' + i" v-if="results[i] !== undefined" class="btn btn-info feedback-btn">{{ $t("result.readAnswer") }}</b-btn>
                   <b-btn v-if="results[i].confidence === 1" @click="sendFeedback(i)" class="btn btn-outline-info feedback-btn" :id="'feedback-'+i">{{ $t("result.feedbackAsLowConfidence") }}</b-btn>
                  <b-btn v-else-if="results[i].confidence === 0" @click="sendFeedback(i)" class="btn btn-outline-info feedback-btn" :id="'feedback-'+i">{{ $t("result.feedbackAsHighConfidence") }}</b-btn> 
                </div>
              </td>
            </tr>
            <tr v-if="results[i] !== undefined">
              <td colspan="2">
                <b-collapse :id="'collapse' + i">
                  <b-card>
                    <div class="row">
                      <div class="col-7">
                        <p>{{ questions[i].direction }}</p>
                        <p><span v-html="questions[i].text"></span></p>
                        <ol>
                          <li v-for="(c, j) in questions[i].choices">
                            {{ c }}
                            <span v-if="questions[i].answer === j" class="green">{{ $t("result.correct") }}</span>
                            <span v-if="results[i].choice === j" class="red">{{ $t("result.selected") }}</span>
                          </li>
                        </ol>
                      </div>
                      <div v-if="gazePlot" class="col">
                        <progressive-img :src="'http://localhost:8766/'+i+'/?time='+Date.now()" placeholder="static/img/loading.gif" :blur="0" aspect-ratio=1.0 />
                      </div>
                    </div>
                  </b-card>
                </b-collapse>
              </td>
            </tr>
          </template>
          </table>
        </table> -->
        <!-- <p class="result-description" v-html="$t('result.resultDesciption')"></p>
        <p class="result-description" v-html="$t('result.feedbackDesciption')"></p>
        <div style="text-align: center;">
        <router-link
          :to="{name: 'index', params: {}}"
          tag="button" class="btn navbar-btn">{{ $t("result.returnToMenu") }}</router-link>
        <router-link v-if="nextProbPath"
          :to="{ name: 'question', params: {fileName: nextProbPath, questionId: 0} }"
          tag="button" class="btn navbar-btn">{{ $t("result.nextProb") }}</router-link>
			  </div>
      </div> -->
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse'
import fs from 'fs'
import Store from 'electron-store'
const electronStore = new Store()

function getNextProbPath (path) {
  const cp = path.match(/\d-\d\d/g)
  const pi = cp[0].match(/\d\d/g)
  console.log(cp)
  console.log(pi)
  if (pi == null) {
    return false
  }
  var probId = pi[0]
  var nextId = Number(probId) + 1
  nextId = ('00' + nextId).slice(-2)
  probId = '-' + probId
  nextId = '-' + nextId
  var nextPath = path.replace(probId, nextId)
  try {
    fs.statSync(nextPath)
    return nextPath
  } catch (err) {
    return false
  }
}

export default {
  data () {
    return {
      questions: [],
      results: this.$store.state.Result.results,
      nextProbPath: getNextProbPath(this.$store.state.Result.currentProbPath),
      gazePlot: electronStore.get('gazePlot')
    }
  },
  created () {
    console.log(getNextProbPath(this.$store.state.Result.currentProbPath))
    this.$store.commit('RESET_RESULTS')
    const csv = fs.readFileSync(this.$route.params.fileName, 'utf-8')
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
  },
  methods: {
    currentProb () {
      const cp = this.$store.state.Result.currentProbPath.match(/\d-\d\d/)
      if (cp == null) {
        return ''
      }
      return cp[0]
    },
    sendFeedback (questionId) {
      const button = document.getElementById('feedback-' + questionId)
      const result = this.results[questionId]
      const confidence = (result.confidence === 0) ? 1 : 0
      if (button.textContent === this.$t('result.cancelFeedback')) {
        if (confidence === 0) {
          button.textContent = this.$t('result.feedbackAsLowConfidence')
        } else {
          button.textContent = this.$t('result.feedbackAsHighConfidence')
        }
      } else {
        button.textContent = this.$t('result.cancelFeedback')
      }
      this.$http({
        method: 'post',
        url: 'http://localhost:8765/mcq_confidence/feedback',
        data: JSON.stringify({
          id: result.id,
          confidence: confidence
        })
      })
    }
  }
}
</script>

<style lang="scss">

#headerprobid {
	font-style: italic;
}

.table th, .table td {
  padding: 0.3em;
  border-top: 0;
}

#result-content {
  margin: 25px;
}

.result-description {
  font-size: 16px;
}

.feedback-btn {
  font-size: 14px;
}

.red {
  color: $red;
}

.green {
  color: $green;
}
</style>
