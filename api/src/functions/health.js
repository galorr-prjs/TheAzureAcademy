const { app } = require("@azure/functions");
app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return {
      jsonBody: {
        status: "ok",
        service: "azure-academy-api",
        time: new Date().toISOString()
      }
    };
  }
});