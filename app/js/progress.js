const STORAGE_KEY = "azure-academy-progress";

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

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Storage is unavailable, so progress just won't be kept.
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