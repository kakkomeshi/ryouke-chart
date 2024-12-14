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
            }
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
                .filter(([type]) => !this.excludedTypes.has(type) && this.scores[type] > 0); // 除外されていないタイプのみ

            // 残ったスコアの中で最大値を持つタイプを選ぶ
            if (validScores.length === 0) {
                return "該当なし"; // すべて除外された場合
            }

            const [resultType] = validScores.reduce((maxEntry, currentEntry) =>
                currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry
            );
            return this.typeMapping[resultType];
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
            for (let type in selectedScores) {
                this.scores[type] += selectedScores[type];

                // スコアが0の回答が選ばれている場合、そのタイプを除外
                if (selectedScores[type] === 0) {
                    this.excludedTypes.add(type);
                }
            }
            this.currentQuestionIndex++;
        },
        resetQuiz() {
            this.scores = Object.fromEntries(Object.keys(this.scores).map(key => [key, 0]));
            this.excludedTypes.clear(); // 除外されたタイプもリセット
            this.currentQuestionIndex = 0;
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
            })
            .catch(error => console.error("JSONの読み込みエラー:", error));
    }
});

app.mount('#app');
