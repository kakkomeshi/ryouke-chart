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
        };
    },
    methods: {
        startQuiz() {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

            this.quizStarted = true; // 診断をスタート
            this.loadQuestions(); // 質問をロード
        },
        loadQuestions() {
            // JSONデータを読み込む（ここではローカルで定義）
            fetch("question.json")
                .then((response) => response.json())
                .then((data) => {
                    this.questions = data.questions;
                    this.selectRandomQuestion(); // 最初の質問をランダムに選択
                });
            fetch("code.json")
                .then((response) => response.json())
                .then((data) => {
                    this.types = data.types;
                    this.remainingTypes = JSON.parse(JSON.stringify(Object.keys(this.types)))
                    // this.isLoading = false; // JSON読み込み完了

                });
            fetch("captions.json")
                .then((response) => response.json())
                .then((data) => {
                    this.captions = data.captions;
                    this.isLoading = false; // JSON読み込み完了
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
            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

            this.questionHistory[this.nowQuestionIndex+1].answered = selectedOption;
            this.questionHistory[this.nowQuestionIndex+1].excludedTypes = this.remainingTypes.filter(
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

        },
        goBack() {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-right', 'slide-in-left');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-left');

            if (this.nowQuestionIndex > 0) {
                // 最後の質問を戻る
                const previousQuestionIndex = this.questionHistory[this.nowQuestionIndex ].questIndex; // 戻る先の質問インデックス
                this.currentQuestionIndex = previousQuestionIndex; // 戻る先の質問をセット

                // 戻り先の質問で除外されたタイプを復元
                const lastExcludedTypes = this.questionHistory[this.nowQuestionIndex ].excludedTypes || [];
                this.remainingTypes = [...this.remainingTypes, ...lastExcludedTypes];

                // 履歴から消す
                this.questionHistory.pop();
                this.nowQuestionIndex--;
            }

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
            // const container = document.getElementById('app');
            // container.classList.remove('slide-in-right', 'slide-in-left');
            // container.offsetWidth; // 強制的に再描画
            // container.classList.add('slide-in-left');
            // 状態をリセット
            this.currentQuestionIndex = 0;
            this.remainingTypes = JSON.parse(JSON.stringify(this.types))
            this.result = null;
            this.resultTypeCode = null;
            this.quizFinished = false;
            this.quizStarted = false;
            this.questionHistory = [];//質問の履歴
            this.nowQuestionIndex = 0;//今何問目？
            this.loadQuestions();
        },

        shareOnTwitter() {
            const baseUrl = "https://twitter.com/intent/tweet";
            const text = `【リョ受けカプ診断】あなたへのおすすめリョ受けカプは: ${this.result} #生意気なHERO`; // ツイートの内容
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
