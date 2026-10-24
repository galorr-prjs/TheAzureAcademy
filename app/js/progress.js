const STORAGE_KEY = "azure-academy-progress";

let cloudUser = null;
const cloudReady = initCloud();

// Asks Azure who is signed in. Locally (localhost) this fails quietly, so you stay signed out.
async function initCloud() {
  try {
    const response = await fetch("/.auth/me");
    const data = await response.json();
    cloudUser = data.clientPrincipal || null;
  } catch (error) {
    cloudUser = null;
  }
  return cloudUser;
}

function emptyProgress() {
  return { completed: [], xp: 0, streak: 0, lastActive: null, quizScores: {}, log: [] };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...emptyProgress(), ...saved };
  } catch (error) {
    return emptyProgress();
  }
}

function writeLocal(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Storage is unavailable, so progress just won't be kept in this browser.
  }
}

function pushToCloud(progress) {
  if (!cloudUser) return;
  // keepalive lets the request finish even if the page changes right after.
  fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
    keepalive: true
  }).catch(() => {
    // Offline or API down: the browser copy still has the progress.
  });
}

function saveProgress(progress) {
  writeLocal(progress);
  pushToCloud(progress);
}

// Loads the cloud copy into the browser. Returns true if the browser copy changed.
async function pullFromCloud() {
  await cloudReady;
  if (!cloudUser) return false;
  try {
    const response = await fetch("/api/progress");
    if (!response.ok) return false;
    const cloud = { ...emptyProgress(), ...(await response.json()) };
    const local = loadProgress();
    const cloudHasData = cloud.completed.length > 0 || cloud.xp > 0 || Object.keys(cloud.quizScores).length > 0;

    if (cloudHasData) {
      writeLocal(cloud);
      return JSON.stringify(cloud) !== JSON.stringify(local);
    }

    // First sign-in: upload any progress already stored in this browser.
    const localHasData = local.completed.length > 0 || local.xp > 0;
    if (localHasData) pushToCloud(local);
    return false;
  } catch (error) {
    return false;
  }
}

async function renderAccount() {
  const slot = document.getElementById("account");
  if (!slot) return;
  await cloudReady;
  slot.textContent = "";

  if (cloudUser) {
    const name = document.createElement("span");
    name.className = "account-name";
    name.textContent = cloudUser.userDetails;
    const out = document.createElement("a");
    out.href = "/.auth/logout?post_logout_redirect_uri=/";
    out.textContent = "sign out";
    out.addEventListener("click", () => localStorage.removeItem(STORAGE_KEY));
    slot.append(name, out);
  } else {
    const back = encodeURIComponent(location.pathname + location.search);
    const link = document.createElement("a");
    link.href = "/.auth/login/github?post_login_redirect_uri=" + back;
    link.textContent = "sign in";
    const note = document.createElement("span");
    note.className = "account-note";
    note.textContent = "to save your progress to your account";
    slot.append(link, note);
  }
}

function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function currentStreak(progress) {
  if (!progress.lastActive) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const recent = [dayKey(new Date()), dayKey(yesterday)];
  return recent.includes(progress.lastActive) ? progress.streak : 0;
}

function touchStreak(progress) {
  const today = dayKey(new Date());
  if (progress.lastActive === today) return;
  progress.streak = currentStreak(progress) > 0 ? progress.streak + 1 : 1;
  progress.lastActive = today;
}

function addLog(progress, action, text, xp) {
  progress.log.unshift({ at: new Date().toISOString(), action, text, xp: xp || 0 });
  progress.log = progress.log.slice(0, 8);
}

function completeLesson(lesson) {
  const progress = loadProgress();
  if (progress.completed.includes(lesson.id)) return;
  progress.completed.push(lesson.id);
  progress.xp += lesson.xp;
  touchStreak(progress);
  addLog(progress, "Completed", lesson.title, lesson.xp);
  saveProgress(progress);
}

// XP for a quiz is only given the first time, so retakes can't be used to farm XP.
function recordQuiz(lessonId, lessonTitle, correct, total) {
  const progress = loadProgress();
  const percent = Math.round((correct / total) * 100);
  const firstAttempt = !(lessonId in progress.quizScores);
  const gained = firstAttempt ? correct * 10 : 0;
  progress.quizScores[lessonId] = Math.max(percent, progress.quizScores[lessonId] || 0);
  progress.xp += gained;
  touchStreak(progress);
  addLog(progress, "Quiz finished", `${lessonTitle}, ${percent}%`, gained);
  saveProgress(progress);
  return gained;
}

function quizAverage(progress) {
  const scores = Object.values(progress.quizScores);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function timeLabel(iso) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey(date) === dayKey(new Date())) return "TODAY " + time;
  if (dayKey(date) === dayKey(yesterday)) return "YESTERDAY " + time;
  return date.toLocaleDateString([], { day: "numeric", month: "short" }).toUpperCase();
}

renderAccount();