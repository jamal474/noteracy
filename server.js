require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT;
const path = require('path')

// Sub-path this app is mounted at. See config/basePath.js.
const { BASE_PATH } = require('./config/basePath');

// Number of proxy hops in front of this process; nginx sets X-Forwarded-*.
app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));

app.use(session({
    secret: process.env.SESSION_SECRET || 'mr cat in the box',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        // Scoped to the mount; "lax" so the Google callback navigation keeps it.
        path: BASE_PATH,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));

// Comma-separated allowed origins for local dev; CLIENT_URL is always added.
const corsOrigins = [
    ...(process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    process.env.CLIENT_URL,
].map(o => (o || '').trim()).filter(Boolean);

app.use(cors({
    origin: corsOrigins,
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

// Liveness + database readiness; 503 until mongoose is connected.
const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
app.get(`${BASE_PATH}/healthz`, (_req, res) => {
    const state = mongoose.connection.readyState;
    res.status(state === 1 ? 200 : 503).json({
        ok: state === 1,
        db: DB_STATES[state] ?? String(state),
        uptimeSec: Math.round(process.uptime()),
    });
});

app.use(BASE_PATH, require('./routes/auth'));
app.use(BASE_PATH, require('./routes/dashboard'));
app.use(BASE_PATH, require('./routes/user'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        }
    });
});

// Bare hostname → the app's mount.
app.get('/', (_req, res) => res.redirect(`${BASE_PATH}/`));

if(process.env.NODE_ENV === 'production') {
    // CRA builds with homepage=BASE_PATH, so serve it from the same prefix.
    app.use(BASE_PATH, express.static(path.join(__dirname, "./client/build")));

    app.get(`${BASE_PATH}/*`, function (_, res) {
        res.sendFile(
            path.join(__dirname, "./client/build/index.html"),
            function (err) {
                if (err) res.status(500).send(err);
            }
        );
    });
}

app.listen(port, () => {
    console.log(`App listening on port ${port} (mounted at ${BASE_PATH})`);
})
