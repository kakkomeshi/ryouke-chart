const app = Vue.createApp({
    data() {
        return {
            questions: [], // 質問データを格納
            types: [],//タイプ一覧
            currentQuestionIndex: 0, // 現在の質問
            remainingTypes: [], // 残った診断結果候補
            isLoading: true, // JSON読み込み中の状態
            quizFinished: false, // 診断終了フラグ
            result: null,//結果
            questionHistory: [],//質問の履歴
            nowQuestionIndex: 0//今の質問数のインデックス
        };
    },
    methods: {
        loadQuestions() {
            // JSONデータを読み込む（ここではローカルで定義）
            fetch("question2.json")
                .then((response) => response.json())
                .then((data) => {
                    this.questions = data.questions;
                    this.selectRandomQuestion(); // 最初の質問をランダムに選択
                });
            fetch("code.json")
                .then((response) => response.json())
                .then((data) => {
                    this.types = Object.keys(data.types);
                    this.remainingTypes = JSON.parse(JSON.stringify(this.types))
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
            // this.nowQuestionIndex++;//何問目かを追加
        },

        // 次の質問を選ぶ
        selectNextQuestion() {
            const validQuestions = this.questions.filter((question, index) => {
                // すでに出題された質問でないことを確認
                const isNotAsked = !this.questionHistory.some(history => history.questIndex === index);
                // 残ったタイプに関連する質問であることを確認
                const hasRelevantTypes = question.options.some(option =>
                    option.includedTypes.some(type => this.remainingTypes.includes(type))
                );
                return isNotAsked && hasRelevantTypes;
            });

            //選べる質問の中からランダムで出題。ない場合は終了判定へ
            if (validQuestions.length > 0) {
                const randomQuestion = validQuestions[Math.floor(Math.random() * validQuestions.length)];
                this.currentQuestionIndex = this.questions.indexOf(randomQuestion);
            } else {
                this.calculateResult();
            }
            this.questionHistory.push(
                {
                    questIndex: this.currentQuestionIndex,
                    answered: null,
                    // includeTypes: [],
                    excludedTypes: []
                }
            )
            this.nowQuestionIndex++;//何問目かを追加
        },
        handleAnswer(selectedOption) {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

            this.questionHistory[this.nowQuestionIndex ].answered = selectedOption;
            this.questionHistory[this.nowQuestionIndex ].excludedTypes = this.remainingTypes.filter(
                (type) => !selectedOption.includedTypes.includes(type)
            );;

            // タイプを絞り込む処理
            if (selectedOption.answer !== "どちらともいえない") {
                this.remainingTypes = this.remainingTypes.filter((type) =>
                    selectedOption.includedTypes.includes(type)
                );
            }
            //終了判定
            this.calculateResult();
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
                const previousQuestionIndex = this.questionHistory[this.nowQuestionIndex - 1].questIndex; // 戻る先の質問インデックス
                this.currentQuestionIndex = previousQuestionIndex; // 戻る先の質問をセット

                // 戻り先の質問で除外されたタイプを復元
                const lastExcludedTypes = this.questionHistory[this.nowQuestionIndex - 1].excludedTypes || [];
                this.remainingTypes = [...this.remainingTypes, ...lastExcludedTypes];

                // 履歴から消す
                this.questionHistory.pop();
                this.nowQuestionIndex--;
            }

        },
        calculateResult() {
            //絞り込み結果が0件
            if (this.remainingTypes.length === 0) {
                this.result = "該当なし";
                this.quizFinished = true;
            }
            //絞り込み結果が１件で特定されている
            if (this.remainingTypes.length === 1) {
                this.result = this.remainingTypes[0];
                this.quizFinished = true;
            }
            //現在の質問数が全質問数に到達している
            if (this.nowQuestionIndex === this.questions.length) {
                //絞り込み結果が0件
                if (this.remainingTypes.length === 0) {
                    this.result = "該当なし";
                    this.quizFinished = true;
                }
                //絞り込み結果が１件で特定されている
                else if (this.remainingTypes.length === 1) {
                    this.result = this.remainingTypes[0];
                    this.quizFinished = true;
                }
                else {
                    //絞り込み結果が複数ある
                    this.result = this.remainingTypes;
                    this.quizFinished = true;
                }
            }
        },
        resetQuiz() {
            // 状態をリセット
            this.currentQuestionIndex = 0;
            this.remainingTypes = JSON.parse(JSON.stringify(this.types))
            this.quizFinished = false;
            this.questionHistory = [];//質問の履歴
            this.nowQuestionIndex = 0;//今何問目？
            this.loadQuestions();
        },
    },
    mounted() {
        this.loadQuestions();
    }
});

app.mount("#app");
