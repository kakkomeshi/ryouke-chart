const typeMapping = {
    RYOGA: "リョガリョ",
    FUJI: "不二リョ",
    TEDUKA: "塚リョ",
    ATOBE: "跡リョ",
    KINTARO: "金リョ",
    YUKIMURA: "幸リョ",
    // … 他のタイプ (Zまで続けるなど)
    // Y: "夢想家",
    // Z: "探求者"
};
const questions = [
    {
        text: "リョーマくんと二人で行くデート先は？",
        options: [
            { answer: "ゆったり水族館", scores: { ATOBE: 2, TEDUKA: 1, YUKIMURA: 1, RYOGA: 1, KINTARO: 0 } },
            { answer: "わくわく遊園地", scores: { ATOBE: 2, TEDUKA: 1, YUKIMURA: 3, RYOGA: 4, KINTARO: 5 } },
            { answer: "のんびりおうちデート", scores: { ATOBE: 4, TEDUKA: 4, YUKIMURA: 4, RYOGA: 3, KINTARO: 0 } },
        ]
    },
    {
        text: "リョーマくんを食事に誘うなら？",
        options: [
            { answer: "ファーストフード", scores: { ATOBE: 0, TEDUKA: 2, YUKIMURA: 2, RYOGA: 4, KINTARO: 5 } },
            { answer: "ラーメン", scores: { ATOBE: 1, TEDUKA: 4, YUKIMURA: 3, RYOGA: 4, KINTARO: 5 } },
            { answer: "定食屋", scores: { ATOBE: 1, TEDUKA: 4, YUKIMURA: 4, RYOGA: 3, KINTARO: 3 } },
            { answer: "高級フレンチ", scores: { ATOBE: 5, TEDUKA: 3, YUKIMURA: 4, RYOGA: 3, KINTARO: 0 } },
        ]
    },
];

let currentQuestionIndex = 0;
let scores = { RYOGA: 0, FUJI: 0, TEDUKA: 0, ATOBE: 0, KINTARO: 0, YUKIMURA: 0, G: 0, H: 0, I: 0, J: 0 };

const questionContainer = document.getElementById("question-container");
const resultContainer = document.getElementById("result-container");
const questionElement = document.getElementById("question");
const resultElement = document.getElementById("result");

function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.text;

    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option.answer;
        button.addEventListener("click", () => handleAnswer(option.scores));
        optionsContainer.appendChild(button);
    });
}

function handleAnswer(selectedScores) {
    for (let type in selectedScores) {
        scores[type] += selectedScores[type];
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    questionContainer.style.display = "none";
    resultContainer.style.display = "block";

    // スコアが最も高いタイプコードを取得
    const resultCode = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    // タイプ名をマッピング
    const resultTypeName = typeMapping[resultCode];

    resultElement.textContent = `あなたにおすすめのカップリングは「${resultTypeName}」です！`;
}
function resetScores() {
    for (let type in scores) {
        scores[type] = 0;
    }
}

document.getElementById("retry-button").addEventListener("click", () => {
    resetScores();
    currentQuestionIndex = 0;
    resultContainer.style.display = "none";
    questionContainer.style.display = "block";
    showQuestion();
});

showQuestion();
