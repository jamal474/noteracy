require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const app = express();
const port = process.env.PORT;
const path = require('path')

app.use(session({
    secret: process.env.SESSION_SECRET || 'mr cat in the box',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials : true,
}));
connectDB()

const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(morgan('dev'));

app.use('/',require('./routes/auth'));
app.use('/',require('./routes/dashboard'));
app.use('/', require('./routes/user'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        }
    });
});

if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "./client/build")));

    app.get("*", function (_, res) {
        res.sendFile(
            path.join(__dirname, "./client/build/index.html"),
            function (err) {
                res.status(500).send(err);
            }
        );
    });
}

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})