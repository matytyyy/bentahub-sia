require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Each member's route file is mounted only if it exists, so the server still starts
// while teammates' branches are being merged one by one.
const mounts = {
  auth: '/api/auth',       // Ijan
  zone: '/api/zones',      // Ib-Ib
  listing: '/api/listings',// Dinglasan
  meetup: '/api/meetups',  // Espiritu
  chat: '/api/chats',      // Cabugnason
  review: '/api/reviews'   // Gemina
};
for (const [name, base] of Object.entries(mounts)) {
  const file = path.join(__dirname, 'routes', `${name}Routes.js`);
  if (fs.existsSync(file)) app.use(base, require(file));
}

app.use('/api', (req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404)));
app.use(errorHandler);

const PORT = process.env.PORT || 1234;
if (require.main === module) {
  app.listen(PORT, () => console.log(`BentaHub SIA running on http://localhost:${PORT}`));

  // Unique feature, automatic part: every minute, expire meetups nobody confirmed/completed.
  const workflowFile = path.join(__dirname, 'models', 'workflowModel.js');
  if (fs.existsSync(workflowFile)) {
    const workflow = require(workflowFile);
    setInterval(() => {
      workflow.expireStaleMeetups().catch((e) => console.error('Workflow error:', e.message));
    }, 60 * 1000);
  }
}
module.exports = app;
