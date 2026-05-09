const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'tapmyjob_secret_key',
  resave: false,
  saveUninitialized: true,
}));

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

app.get('/', (req, res) => {
  res.send('TapMyJob API is running');
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

module.exports = app;
