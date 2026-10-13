const path = require('path');

// One .env at the project root is shared with the React app (which only sees REACT_APP_* values)
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

module.exports = {
  port: Number(process.env.SERVER_PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'tc_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
  },
};
