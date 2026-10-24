let state = loadProgress();

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  await pullFromCloud();
  state = loadProgress();
  const response = await fetch("data/lessons.json");
  const data = await response.json();
  const path = data.paths[0];
  const index = path.lessons.findIndex(lesson => lesson.id === id);

  if (index === -1) {
    document.getElementById("lesson").textContent = "Lesson not found.";
    return;
  }

  const lesson = path.lessons[index];
  document.title = lesson.title + " – Azure Academy";
  renderLesson(path, lesson, index);
  renderSide(path, lesson);
}

function statusOf(path, lesson) {
  const current = path.lessons.find(item => !state.completed.includes(item.id));
  if (state.completed.includes(lesson.id)) return { cls: "done", label: "PROVISIONED" };
  if (current && current.id === lesson.id) return { cls: "current", label: "DEPLOYING" };
  return { cls: "todo", label: "NOT STARTED" };
}

function renderLesson(path, lesson, index) {
  const prev = path.lessons[index - 1];
  const next = path.lessons[index + 1];
  const status = statusOf(path, lesson);
  const length = lesson.minutes ? `${lesson.minutes} min · ` : "";

  const cards = (lesson.cards || [])
    .map(card => `<div class="card" style="--c: ${card.color}"><div class="card-tag">${card.tag}</div><div class="card-title">${card.title}</div><div class="card-manage">${card.manage}</div><div class="card-example">${card.example}</div></div>`)
    .join("");

  const lab = lesson.lab
    ? `<div class="lab"><div class="group-tag">lab: ${lesson.lab.id}</div><div class="lab-text">${lesson.lab.text}</div><button class="btn btn-ghost">Open lab</button></div>`
    : "";

  document.getElementById("lesson").innerHTML = `
    <div class="crumbs">${path.id} / ${lesson.id} <span class="chip node ${status.cls}" style="border:0;padding:2px 8px;flex:none;min-width:0">${status.label}</span> ${length}+${lesson.xp} XP</div>
    <h1>${lesson.title}</h1>
    <p class="lead">${lesson.lead || "This lesson is coming soon."}</p>
    ${cards ? `<div class="cards">${cards}</div>` : ""}
    ${lesson.analogy ? `<div class="callout"><span>ANALOGY</span><br>${lesson.analogy}</div>` : ""}
    ${lab}
    ${lesson.lead ? `<a class="btn btn-ghost" style="align-self: flex-start" href="quiz.html?id=${lesson.id}">Take the quiz</a>` : ""}
    <div class="nav-row">
      ${prev ? `<a class="btn" href="lesson.html?id=${prev.id}">Previous lesson</a>` : "<span></span>"}
      ${next
        ? `<a class="btn btn-primary" data-complete href="lesson.html?id=${next.id}">Complete and continue</a>`
        : `<a class="btn btn-primary" data-complete href="index.html">Complete and finish</a>`}
    </div>`;

  document.querySelector("[data-complete]").addEventListener("click", () => completeLesson(lesson));
  }

function renderSide(path, lesson) {
  const steps = path.lessons
    .map(item => {
      const status = statusOf(path, item);
      const viewing = item.id === lesson.id ? "viewing" : "";
      return `<a class="step ${status.cls} ${viewing}" href="lesson.html?id=${item.id}"><span class="chip">${status.label}</span><div>${item.title}</div></a>`;
    })
    .join("");
  document.getElementById("side").innerHTML = `<div class="log-head">deployment-steps</div>${steps}`;
}

init().catch(error => {
     document.getElementById("lesson").textContent = "Could not load the lesson: " + error.message;
   });