const app = Vue.createApp({
    data() {
        return {
            questions: [], // ランダムに選ばれる質問
            currentQuestionIndex: 0,
            scores: {
                RYG: 0, INU: 0, KIK: 0, FJI: 0, DKA: 0,
                ATO: 0, SAN: 0, NIO: 0, BUN: 0, KIN: 0,
                YUK: 0, TOK: 0, RAL: 0,
            },
            excludedTypes: new Set(), // スコア0の回答を選んだタイプを格納
            selectedAnswers: [], // 各質問で選んだ回答を記録
            typeMapping: {
                RYG: "リョガリョ",
                INU: "乾リョ",
                KIK: "菊リョ",
                FJI: "不二リョ",
                DKA: "塚リョ",
                ATO: "跡リョ",
                SAN: "真リョ",
                NIO: "仁王リョ",
                BUN: "ブンリョ",
                KIN: "金リョ",
                YUK: "幸リョ",
                TOK: "徳リョ",
                RAL: "ラルリョ",
            },
            quizFinished: false, // 診断終了フラグ
            isLoading: true // JSON読み込み中の状態
            
        };
    },
    computed: {

        resultTypeName() {
            // すべてのタイプのスコアが0の場合は該当なし
            if (Object.values(this.scores).every(score => score === 0)) {
              return "該当なし";
            }
      
            // 除外されたタイプを除いた結果を計算
            const validScores = Object.entries(this.scores)
              .filter(([type]) => !this.excludedTypes.has(type) && this.scores[type] > 0);
      
            // 残ったスコアの中で最大値を持つタイプを選ぶ
            if (validScores.length === 0) {
              return "該当なし";
            }
      
            const [resultType] = validScores.reduce((maxEntry, currentEntry) =>
              currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry
            );
            return this.typeMapping[resultType] || "該当なし";
          }
    },
    methods: {
        /**
         * ランダムに質問を選ぶ
         */
        shuffleQuestions() {
            const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
            this.questions = shuffled.slice(0, 3);
        },
        handleAnswer(selectedScores) {
            // 現在の質問の回答を記録
            this.selectedAnswers[this.currentQuestionIndex] = selectedScores;

            // スコアを更新
            for (let type in selectedScores) {
                this.scores[type] += selectedScores[type];
                // スコアが0の回答が選ばれている場合、そのタイプを除外
                if (selectedScores[type] === 0) {
                    this.excludedTypes.add(type);
                }
            }

            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
              } else {
                this.quizFinished = true; // 最後の質問後に結果画面へ
              }
        },

        goBack() {
            if (this.currentQuestionIndex > 0) {
                // 現在の質問の回答を元にスコアをリセット
                const previousScores = this.selectedAnswers[this.currentQuestionIndex];
                for (let type in previousScores) {
                    this.scores[type] -= previousScores[type];
                    if (previousScores[type] === 0) {
                        this.excludedTypes.delete(type);
                    }
                }
                // 質問を戻る
                this.currentQuestionIndex--;
            }
        },

        resetQuiz() {
            this.scores = Object.fromEntries(Object.keys(this.scores).map(key => [key, 0]));
            this.excludedTypes.clear(); // 除外されたタイプもリセット
            this.currentQuestionIndex = 0;
            this.quizFinished = false;
            // this.shuffleQuestions();
        }
    },
    mounted() {
        // JSONファイルを非同期に読み込む
        fetch('question.json')
            .then(response => response.json())
            .then(data => {
                this.questions = data.questions;
                // this.shuffleQuestions();
                this.isLoading = false; // JSON読み込み完了
            })
            .catch(error => console.error("JSONの読み込みエラー:", error));
    }
});

app.mount('#app');
