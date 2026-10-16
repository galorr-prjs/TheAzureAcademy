// Temporary demo progress. Step 4 will replace this with real saved progress.
const state = {
  completed: ["what-is-cloud-computing"],
  xp: 240,
  streak: 3,
  quizAverage: 80,
  log: [
    { time: "TODAY 10:42", action: "Completed", text: "What is cloud computing?", xp: "+50 XP" },
    { time: "TODAY 10:31", action: "Started", text: "Cloud service models" },
    { time: "YESTERDAY", action: "Quiz passed", text: "Cloud concepts, 80%" },
    { time: "2 DAYS AGO", action: "Streak started", text: "Day 1" }
  ]
};

async function init() {
  const response = await fetch("data/lessons.json");
  const data = await response.json();
  renderStats();
  renderMainPath(data.paths[0]);
  renderOtherPaths(data.paths.slice(1));
  renderLog();
}

function renderStats() {
  const items = [
    ["STREAK", state.streak + "d"],
    ["XP", state.xp],
    ["QUIZ AVG", state.quizAverage + "%"]
  ];
  document.getElementById("stats").innerHTML = items
    .map(([label, value]) => `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`)
    .join("");
}

function renderMainPath(path) {
  const current = path.lessons.find(lesson => !state.completed.includes(lesson.id));

  const nodes = path.lessons.map((lesson, index) => {
    const done = state.completed.includes(lesson.id);
    const isCurrent = current && lesson.id === current.id;
    const status = done ? "done" : isCurrent ? "current" : "todo";
    const label = done ? "PROVISIONED" : isCurrent ? "DEPLOYING" : "NOT STARTED";
    const meta = done ? `+${lesson.xp} XP` : lesson.minutes ? `${lesson.minutes} min` : path.exam;
    const link = index < path.lessons.length - 1
      ? `<div class="link ${done || isCurrent ? "" : "todo"}"></div>`
      : "";
    return `<div class="node ${status}"><span class="chip">${label}</span><div class="node-title">${lesson.title}</div><div class="node-meta">${meta}</div></div>${link}`;
  });

  document.getElementById("main-path").innerHTML =
    `<div class="group"><div class="group-tag">resource-group: ${path.id}</div><div class="flow">${nodes.join("")}</div></div>`;

  const button = document.getElementById("continue-btn");
  button.textContent = current ? `Continue: ${current.title}` : "Path complete";
  // Step 3 will link this button to the lesson page.
}

function renderOtherPaths(paths) {
  document.getElementById("other-paths").innerHTML = paths
    .map(path => `<div class="group small"><div class="group-tag" style="background: ${path.color}">${path.id}</div><h3>${path.title}</h3><div class="services">${path.services.join("<br>")}</div></div>`)
    .join("");
}

function renderLog() {
  const items = state.log
    .map(entry => `<div class="log-item"><div class="log-time">${entry.time}</div><strong>${entry.action}</strong> ${entry.text}${entry.xp ? `<div class="log-xp">${entry.xp}</div>` : ""}</div>`)
    .join("");
  document.getElementById("log").innerHTML = `<div class="log-head">activity-log</div>${items}`;
}

init().catch(error => {
  document.getElementById("main-path").textContent = "Could not load lessons: " + error.message;
});