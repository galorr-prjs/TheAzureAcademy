const lessonId = new URLSearchParams(location.search).get("id");
let questions = [];
let current = 0;
let correctCount = 0;
let lessonTitle = lessonId;

async function init() {
  document.getElementById("exit").href = "lesson.html?id=" + lessonId;
  const response = await fetch("data/quizzes.json");
  const quizzes = await response.json();
  questions = quizzes[lessonId] || [];
  const lessonsResponse = await fetch("data/lessons.json");
  const lessonsData = await lessonsResponse.json();
  const found = lessonsData.paths.flatMap(path => path.lessons).find(lesson => lesson.id === lessonId);
if (found) lessonTitle = found.title;

  if (questions.length === 0) {
    document.getElementById("quiz").textContent = "There is no quiz for this lesson yet.";
    return;
  }
  renderQuestion();
}

function renderBlocks() {
  document.getElementById("blocks").innerHTML = questions
    .map((_, i) => `<div class="block ${i < current ? "done" : i === current ? "now" : ""}"></div>`)
    .join("");
  document.getElementById("xp-chip").textContent = `+${correctCount * 10} XP`;
}

function renderQuestion() {
  const q = questions[current];
  renderBlocks();

  const options = q.options
    .map((text, i) => `<button class="option" data-index="${i}"><span class="letter">${"ABCD"[i]}</span>${text}</button>`)
    .join("");

  document.getElementById("quiz").innerHTML = `
    <div class="q-meta">question ${current + 1} of ${questions.length} · ${lessonId}</div>
    <h1 class="q-text">${q.question}</h1>
    <div class="options">${options}</div>
    <section class="feedback" id="feedback" hidden></section>
    <div class="q-foot">
      <span class="q-count">${current} of ${questions.length} answered</span>
      <button class="btn btn-primary" id="next" hidden></button>
    </div>`;

  document.querySelectorAll(".option").forEach(button => {
    button.addEventListener("click", () => choose(Number(button.dataset.index)));
  });
}

function choose(index) {
  const q = questions[current];
  const isCorrect = index === q.answer;
  if (isCorrect) correctCount++;

  document.querySelectorAll(".option").forEach((button, i) => {
    button.disabled = true;
    if (i === q.answer) button.classList.add("correct");
    else if (i === index) button.classList.add("wrong");
  });

  const feedback = document.getElementById("feedback");
  feedback.className = "feedback " + (isCorrect ? "correct" : "wrong");
  feedback.innerHTML = `<div class="feedback-title">${isCorrect ? "CORRECT · +10 XP" : "NOT QUITE"}</div><p>${q.explanation}</p>`;
  feedback.hidden = false;

  document.querySelector(".q-count").textContent = `${current + 1} of ${questions.length} answered`;
  renderBlocks();

  const next = document.getElementById("next");
  next.textContent = current + 1 < questions.length ? "Next question" : "See results";
  next.hidden = false;
  next.addEventListener("click", () => {
    current++;
    if (current < questions.length) renderQuestion();
    else renderResults();
  });
}

function renderResults() {
  renderBlocks();
  const percent = Math.round((correctCount / questions.length) * 100);
  const gained = recordQuiz(lessonId, lessonTitle, correctCount, questions.length);
  const note = gained > 0
    ? "Your score and XP have been saved."
    : "Your score is saved. XP is only given the first time you take a quiz.";
  document.getElementById("quiz").innerHTML = `
    <div class="q-meta">quiz complete · ${lessonId}</div>
    <h1 class="q-text">${correctCount} of ${questions.length} correct</h1>
    <div class="stats">
    <div class="stat"><div class="stat-label">SCORE</div><div class="stat-value">${percent}%</div></div>
    <div class="stat"><div class="stat-label">XP EARNED</div><div class="stat-value">+${gained}</div></div>
    </div>
    <p class="lead">${note}</p>
    <div class="q-foot">
    <a class="btn" href="lesson.html?id=${lessonId}">Back to lesson</a>
    <a class="btn btn-primary" href="index.html">Back to map</a>
    </div>`;
}

init();