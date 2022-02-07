# coala

Confidence-aware Learning Assistant: Estimating Self-confidences on multiple-choice questions

## Build Setup

```
$ npm install

$ npm run start

$ npm run build
# => Executable files will be created at dist/.
```

## API document for self-confidence estimation

Endpoint: `http://localhost:8765` and `ws://localhost:8765`

### Connecting an eye trakcer

* GET `/tobii_pro/connect`
* GET `/tobii_pro/disconnect`
* WS `/gaze/raw`
* WS `/gaze/fixation`

### Estimating self-confidences

* POST `/mcq_confidence/start_solving`
    ```
    {
        "id": "12345",
        "user_id": "user00",
        "document_id": "doc00",
        "question_id": "q00",
        "text_area": [510, 288, 900, 161],  // [left, top, width, height]
        "choice_areas": [
            [530, 474, 420, 118],
            [960, 474, 420, 118],
            [530, 602, 420, 118],
            [960, 602, 420, 118]
        ]
    }
    ```
* POST `/mcq_confidence/stop_solving`
    ```
    {
        "id": "12345",
        "correctness": 1,  // 1: correct or 0: incorrect
    }
    ```
* POST `/mcq_confidence/feedback`
    ```
    {
        "id": "12345",
        "label": 1,  // 1: condident 0: unconfident
    }
    ```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[4c6ee7b](https://github.com/SimulatedGREG/electron-vue/tree/4c6ee7bf4f9b4aa647a22ec1c1ca29c2e59c3645) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
