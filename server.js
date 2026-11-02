const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves the beautiful frontend

// API Routes (Members will add their files here later)
app.use('/api/auth', require('./routes/authRoutes'));       // Ijan
app.use('/api/zones', require('./routes/zoneRoutes'));       // Ib-Ib
app.use('/api/listings', require('./routes/listingRoutes')); // Dinglasan
app.use('/api/meetups', require('./routes/meetupRoutes'));   // Espiritu
app.use('/api/chats', require('./routes/chatRoutes'));       // Cabugnason
app.use('/api/reviews', require('./routes/reviewRoutes'));   // Gemina

app.use(errorHandler);

app.listen(1234, () => console.log('SIA Server running on http://localhost:1234'));