function getUser(request) {
  const header = request.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (!principal.userId) return null;
    return { id: principal.userId };
  } catch (error) {
    return null;
  }
}

module.exports = { getUser };