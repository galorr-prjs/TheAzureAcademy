const { CosmosClient } = require("@azure/cosmos");

let container;

function getContainer() {
  if (!container) {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    container = client.database("academy").container("progress");
  }
  return container;
}

module.exports = { getContainer };