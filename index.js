const { createApp } = require('./app');

function startServer({ port = process.env.PORT || 80, app = createApp() } = {}) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  createApp,
};
