const app = Vue.createApp({
    data() {
        return {
            questions: [], // 質問データを格納
            currentQuestionIndex: 0, // 現在の質問
            remainingTypes: [], // 残った診断結果候補
            selectedAnswers: [], // 選んだ回答を記録
            isLoading: true, // JSON読み込み中の状態
            quizFinished: false, // 診断終了フラグ
            types: [],//タイプ一覧
            excludedHistory: [], // 各質問で除外されたタイプを記録
            result: null,//結果

        };
    },
    methods: {
        loadQuestions() {
            // JSONデータを読み込む（ここではローカルで定義）
            fetch("question2.json")
                .then((response) => response.json())
                .then((data) => {
                    this.questions = data.questions;
                    // this.types = Object.keys(data.types);
                    // this.remainingTypes = JSON.parse(JSON.stringify(this.types))
                    // this.isLoading = false; // JSON読み込み完了
                });
            fetch("code.json")
                .then((response) => response.json())
                .then((data) => {
                    this.types = Object.keys(data.types);
                    this.remainingTypes = JSON.parse(JSON.stringify(this.types))
                    this.isLoading = false; // JSON読み込み完了

                });

        },
        handleAnswer(selectedOption) {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-left', 'slide-in-right');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-right');

            // 現在の質問の履歴を記録
            this.selectedAnswers[this.currentQuestionIndex] = selectedOption.includedTypes;

            // 除外されたタイプを計算して記録
            const excludedTypes = this.remainingTypes.filter(
                (type) => !selectedOption.includedTypes.includes(type)
            );
            this.excludedHistory[this.currentQuestionIndex] = excludedTypes;

            // タイプを絞り込む処理
            if (selectedOption.answer !== "どちらともいえない") {
                this.remainingTypes = this.remainingTypes.filter((type) =>
                    selectedOption.includedTypes.includes(type)
                );
            }
            // 次の質問に進む
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            } else {
                this.quizFinished = true; // 診断終了
                this.calculateResult();
            }

            // // タイプを絞り込む処理
            // this.remainingTypes = this.remainingTypes.filter((type) =>
            //     selectedOption.includedTypes.includes(type)
            // );

            // // 次の質問へ進む
            // if (this.currentQuestionIndex < this.questions.length - 1) {
            //     this.currentQuestionIndex++;
            // } else {
            //     this.quizFinished = true; // 診断終了
            // }
        },
        goBack() {
            const container = document.getElementById('app');
            container.classList.remove('slide-in-right', 'slide-in-left');
            container.offsetWidth; // 強制的に再描画
            container.classList.add('slide-in-left');

            if (this.currentQuestionIndex > 0) {
                // 現在の質問で除外されたタイプを復元
                const lastExcludedTypes = this.excludedHistory[this.currentQuestionIndex - 1] || [];
                this.remainingTypes = [...this.remainingTypes, ...lastExcludedTypes];

                // 質問を一つ戻る
                this.currentQuestionIndex--;
            }

            // if (this.currentQuestionIndex > 0) {
            //     this.currentQuestionIndex--;

            //     // 前回の選択肢から remainingTypes を復元
            //     const previousIncludedTypes = this.selectedAnswers[this.currentQuestionIndex];
            //     const currentQuestionOptions = this.questions[this.currentQuestionIndex].options;

            //     // 質問に含まれるすべてのタイプを取得
            //     const allPossibleTypes = currentQuestionOptions
            //         .map((option) => option.includedTypes)
            //         .flat();

            //     // 次の remainingTypes を計算（前回の回答に基づいて戻す）
            //     this.remainingTypes = this.remainingTypes.filter((type) =>
            //         allPossibleTypes.includes(type) || previousIncludedTypes.includes(type)
            //     );
            // }
            // if (this.currentQuestionIndex > 0) {
            //     this.currentQuestionIndex--;
            //     const previousAnswer = this.selectedAnswers.pop();

            //     // 候補を復元
            //     this.remainingTypes = this.remainingTypes.concat(previousAnswer.excludedTypes);
            // }
        },
        calculateResult() {
            if (this.remainingTypes.length === 1) {
                this.result = this.remainingTypes[0];
            } else if (this.remainingTypes.length === 0) {
                this.result = "該当なし";
            } else {
                this.result = "複数候補";
            }
        },
        resetQuiz() {
            // 状態をリセット
            this.currentQuestionIndex = 0;
            this.remainingTypes = JSON.parse(JSON.stringify(this.types))
            this.selectedAnswers = [];
            this.quizFinished = false;
        },
        resetRemainingType() {
            this.remainingTypes.add

        }
    },
    mounted() {
        this.loadQuestions();
        // this.resetQuiz()
    }
});

app.mount("#app");
