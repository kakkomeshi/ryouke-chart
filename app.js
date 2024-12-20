const app = Vue.createApp({
    data() {
        return {
            questions: [], // 質問データを格納
            types: [],//タイプ一覧
            captions: [],//結果の文章
            currentQuestionIndex: 0, // 現在の質問
            remainingTypes: [], // 残った診断結果候補
            isLoading: true, // JSON読み込み中の状態
            quizFinished: false, // 診断終了フラグ
            result: null,//結果
            resultTypeCode: null,//結果のタイプコード
            questionHistory: [],//質問の履歴
            nowQuestionIndex: 0,//今の質問数のインデックス
            quizStarted: false, // 診断が開始されたかどうかのフラグ
            API_URL: "https://script.google.com/macros/s/AKfycbxUVBvlse7rJWYvLlp2w1UkDmGxuyydXPW3Sw_pr2lQgnAlbcDy6oK1udA36lpJViHw/exec"
        };
    },
    methods: {
        async startQuiz() {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

            this.quizStarted = true; // 診断をスタート
            // this.loadQuestions(); // 質問をロード
            await this.resetRemainingTypes()
            await this.selectRandomQuestion(); // 最初の質問をランダムに選択
        },
        resetRemainingTypes() {
            this.remainingTypes = JSON.parse(JSON.stringify(Object.keys(this.types)))
        },
        loadQuestions() {
            // キャッシュからの読み込み
            const questionData = sessionStorage.getItem('questionData');
            const captionData = sessionStorage.getItem('captionData');
            const typeData = sessionStorage.getItem('typeData');
            // これは画面マウント時のみ実行する
            // キャッシュが存在する場合
            if (questionData && captionData) {
                // 即座にローディング完了処理を行う
                this.questions = JSON.parse(questionData);
                this.captions = JSON.parse(captionData);
                this.types=JSON.parse(typeData);
                this.isLoading = false;
                return;
            }

            // キャッシュがない場合、リクエストを並列に実行
            Promise.all([
                questionData ?
                    Promise.resolve(JSON.parse(questionData)) :
                    fetch(`${this.API_URL}?type=question`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok ' + response.statusText);
                            }
                            return response.json();
                        })
                        .then(data => {
                            sessionStorage.setItem('questionData', JSON.stringify(data.questions)); // データをキャッシュ
                            return data.questions;
                        }),

                captionData ?
                    Promise.resolve(JSON.parse(captionData)) :
                    fetch(`${this.API_URL}?type=caption`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok ' + response.statusText);
                            }
                            return response.json();
                        })
                        .then(data => {
                            sessionStorage.setItem('captionData', JSON.stringify(data.captions)); // データをキャッシュ
                            return data.captions;
                        }),

                fetch("code.json")
                    .then(response => response.json())
                    .then(data => {
                        sessionStorage.setItem('typeData', JSON.stringify(data.types)); // データをキャッシュ
                        // 取得したtypesをthisに格納
                        this.types = data.types;
                        // remainingTypesにtypesのキーを格納
                        this.remainingTypes = Object.keys(this.types);
                    })
            ])
                .then(([questionData, captionData, codeData]) => {
                    // 質問データとキャプションデータをthisに格納
                    this.questions = questionData;
                    this.captions = captionData;

                    // ローディング完了の処理
                    this.isLoading = false;
                    console.log('All data loaded.');
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operations:', error);
                });

        },
        // 質問を最初からランダムに選ぶ
        selectRandomQuestion() {
            // 最初の質問は全ての質問の中からランダムで選ぶ
            const randomIndex = Math.floor(Math.random() * this.questions.length);
            this.currentQuestionIndex = randomIndex;

            this.questionHistory.push(
                {
                    questIndex: this.currentQuestionIndex,
                    answered: null,
                    excludedTypes: []
                }
            )
        },

        // 次の質問を選ぶ
        selectNextQuestion() {
            // 有効な質問をフィルタリング
            const validQuestions = this.questions.filter((question, index) => {
                // すでに出題された質問でないことを確認
                const isNotAsked = !this.questionHistory.some(history => history.questIndex === index);
                if (isNotAsked) {
                    // この質問を選んだ場合、remainingTypes が 0 になるかを事前にチェック
                    const allIncludedTypes = question.options.flatMap(option => option.includedTypes);

                    // 各選択肢を選んだ場合の remainingTypes の状態を確認
                    const willResultInNoRemainingTypes = question.options.some(option => {
                        const resultingTypes = this.remainingTypes.filter(type => option.includedTypes.includes(type));
                        return resultingTypes.length === 0; // 結果的に remainingTypes が 0 になる場合
                    });
                    // この質問は除外する（remainingTypesが0にならない質問のみ選択）
                    return !willResultInNoRemainingTypes;
                }
                return false; // すでに出題された質問を除外
            });
            if (validQuestions.length === 0) {
                this.calculateResult(); // 結果を計算して終了
                return;
            }

            const scoredQuestions = validQuestions.map(question => ({
                question,
                score: this.calculateQuestionScore(question)
            }));

            // スコアが最大の質問を取得
            const maxScore = Math.max(...scoredQuestions.map(q => q.score));
            const bestQuestions = scoredQuestions.filter(q => q.score === maxScore);

            // ランダムで1つ選ぶ
            const selectedQuestion = bestQuestions[Math.floor(Math.random() * bestQuestions.length)].question;

            this.currentQuestionIndex = this.questions.indexOf(selectedQuestion);

            this.questionHistory.push(
                {
                    questIndex: this.currentQuestionIndex,
                    answered: null,
                    excludedTypes: []
                }
            )
            this.nowQuestionIndex++;
        },

        //質問の選択の重みを計算
        calculateQuestionScore(question) {
            let coverage = 0;
            let eliminationRisk = 0;

            question.options.forEach(option => {
                const included = option.includedTypes.filter(type => this.remainingTypes.includes(type));
                const excluded = this.remainingTypes.filter(type => !included.includes(type));
                // カバー率: この選択肢でカバーされる remainingTypes の数
                coverage += included.length;
                // 排除リスク: この選択肢で remainingTypes がゼロになるリスク
                if (excluded.length === this.remainingTypes.length) {
                    eliminationRisk += 1;
                }
            });
            // カバー率が高く、排除リスクが低い質問ほどスコアが高い
            return coverage - eliminationRisk * 5;
        },

        handleAnswer(selectedOption) {
            this.questionHistory[this.nowQuestionIndex].answered = selectedOption;
            this.questionHistory[this.nowQuestionIndex].excludedTypes = this.remainingTypes.filter(
                (type) => !selectedOption.includedTypes.includes(type)
            );;

            // タイプを絞り込む処理
            if (selectedOption.answer !== "どちらともいえない") {
                this.remainingTypes = this.remainingTypes.filter((type) =>
                    selectedOption.includedTypes.includes(type)
                );
            }
            //終了判定
            if (this.remainingTypes.length === 1) {
                this.calculateResult();
            }
            // 次の質問を選ぶ
            this.selectNextQuestion();

            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

        },
        goBack() {
            if (this.nowQuestionIndex > 0) {
                // 最後の質問を戻る
                const previousQuestionIndex = this.questionHistory[this.nowQuestionIndex - 1].questIndex; // 戻る先の質問インデックス
                this.currentQuestionIndex = previousQuestionIndex; // 戻る先の質問をセット

                // 戻り先の質問で除外されたタイプを復元
                const lastExcludedTypes = this.questionHistory[this.nowQuestionIndex - 1].excludedTypes || [];
                this.remainingTypes = [...this.remainingTypes, ...lastExcludedTypes];

                // 履歴から消す
                this.questionHistory.pop();
                this.nowQuestionIndex--;
            }
            const container = document.getElementById('app');
            container.classList.remove('slide-in-right', 'slide-in-left');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-left');
        },
        calculateResult() {
            //絞り込み結果が0件
            if (this.remainingTypes.length === 0) {
                this.resultTypeCode = null;
                this.result = "該当なし";
                this.quizFinished = true;
            }
            //絞り込み結果が１件で特定されている
            else if (this.remainingTypes.length === 1) {
                this.resultTypeCode = this.remainingTypes[0];
                this.result = this.types[this.resultTypeCode];
                this.quizFinished = true;
            }
            else {
                //絞り込み結果が複数ある場合はランダムでどれかを出す
                this.resultTypeCode = this.remainingTypes[Math.floor(Math.random() * this.remainingTypes.length)];
                this.result = this.types[this.resultTypeCode];
                this.quizFinished = true;
            }
        },
        resetQuiz() {
            // 状態をリセット
            this.currentQuestionIndex = 0;
            this.remainingTypes = JSON.parse(JSON.stringify(this.types))
            this.result = null;
            this.resultTypeCode = null;
            this.quizFinished = false;
            this.quizStarted = false;
            this.questionHistory = [];//質問の履歴
            this.nowQuestionIndex = 0;//今何問目？
        },

        shareOnTwitter() {
            const baseUrl = "https://twitter.com/intent/tweet";
            const text = `【リョ受けカプ診断】あなたへのおすすめリョ受けカプは:『${this.result}』 #リョ受けカプ診断`; // ツイートの内容
            const url = encodeURIComponent(window.location.href); // ページのURL
            const tweetUrl = `${baseUrl}?text=${encodeURIComponent(text)}&url=${url}`;

            window.open(tweetUrl, "_blank"); // 別タブでツイート画面を開く
        }

    },
    mounted() {
        // this.quizStarted = true; // 診断をスタート
        this.loadQuestions();
    }
});

app.mount("#app");
