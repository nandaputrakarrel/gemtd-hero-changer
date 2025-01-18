const serverless = require('@vercel/node');
const app = require('../index');
module.exports = serverless(app);
