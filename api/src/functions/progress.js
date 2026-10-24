const { app } = require("@azure/functions");
const { getContainer } = require("../helpers/cosmos");
const { getUser } = require("../helpers/auth");

function emptyProgress() {
  return { completed: [], xp: 0, streak: 0, lastActive: null, quizScores: {}, log: [] };
}

// Keep only the fields we expect, with limits, so nobody can store arbitrary data.
function cleanProgress(input) {
  const source = input && typeof input === "object" ? input : {};
  const text = (value, max) => String(value ?? "").slice(0, max);
  const number = (value, max) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), max) : 0);

  const completed = Array.isArray(source.completed)
    ? source.completed.filter(item => typeof item === "string").map(item => text(item, 100)).slice(0, 200)
    : [];

  const quizScores = {};
  if (source.quizScores && typeof source.quizScores === "object") {
    for (const [key, value] of Object.entries(source.quizScores).slice(0, 200)) {
      quizScores[text(key, 100)] = number(value, 100);
    }
  }

  const log = Array.isArray(source.log)
    ? source.log.slice(0, 8).map(entry => ({
        at: text(entry && entry.at, 40),
        action: text(entry && entry.action, 60),
        text: text(entry && entry.text, 200),
        xp: number(entry && entry.xp, 1000)
      }))
    : [];

  return {
    completed,
    xp: number(source.xp, 100000),
    streak: number(source.streak, 10000),
    lastActive: source.lastActive ? text(source.lastActive, 10) : null,
    quizScores,
    log
  };
}

app.http("progress", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "progress",
  handler: async (request, context) => {
    const user = getUser(request);
    if (!user) return { status: 401, jsonBody: { error: "Please sign in." } };

    try {
      const container = getContainer();

      if (request.method === "GET") {
        const { resource } = await container.item(user.id, user.id).read();
        return { jsonBody: resource ? resource.progress : emptyProgress() };
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return { status: 400, jsonBody: { error: "Invalid JSON." } };
      }

      const progress = cleanProgress(body);
      await container.items.upsert({
        id: user.id,
        userId: user.id,
        progress,
        updatedAt: new Date().toISOString()
      });
      return { jsonBody: progress };
    } catch (error) {
      context.error("progress failed", error.message);
      return { status: 500, jsonBody: { error: "Something went wrong." } };
    }
  }
});