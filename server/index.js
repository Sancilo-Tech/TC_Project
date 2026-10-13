const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config');
const { errorHandler } = require('./http');

if (!config.jwtSecret) {
  console.error('JWT_SECRET is not set. Add it to the .env file (see .env.example).');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/colleges',  require('./routes/colleges'));
app.use('/api/tcs',       require('./routes/tcs'));
app.use('/api/dropdowns', require('./routes/dropdowns'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// After `npm run build` this same server also serves the React app,
// so a deployment is a single process on a single port.
const buildDir = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.use((req, res) => res.sendFile(path.join(buildDir, 'index.html')));
}

app.use(errorHandler);

app.listen(config.port, err => {
  // Express passes start-up failures (e.g. the port is already taken) here
  if (err) {
    console.error(`Could not start on port ${config.port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`TC server running at http://localhost:${config.port}`);
});
