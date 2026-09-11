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

// Everything this app owns — API, OAuth round-trip and the built React
// client — lives under one prefix. See config/basePath.js.
const { BASE_PATH } = require('./config/basePath');

// Render terminates TLS and Cloudflare adds another hop, so req.protocol and
// req.ip come from X-Forwarded-*. Without this express-session refuses to set
// a `secure` cookie and the rate limiter buckets every visitor together.
app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET || 'mr cat in the box',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        // Scope the cookie to this app's mount. On a shared short domain the
        // neighbouring projects sit on sibling paths, and there is no reason
        // to send them a session they can't use.
        path: BASE_PATH,
        // The Google callback is a top-level GET from accounts.google.com, so
        // the cookie has to survive a cross-site navigation: "lax" allows
        // exactly that and nothing more.
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));

// In production the client is same-origin, so CORS is only really for local
// dev against the CRA dev server. Comma-separated list; CLIENT_URL is included
// automatically so there is one fewer thing to keep in sync.
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

// A hit on the service root (Render's healthcheck, someone typing the bare
// hostname) belongs at the app's real home.
app.get('/', (_req, res) => res.redirect(`${BASE_PATH}/`));

if(process.env.NODE_ENV === 'production') {
    // CRA is built with homepage=BASE_PATH, so index.html asks for
    // /notes/static/… — mounting the static middleware at the same prefix
    // makes those URLs resolve without any rewriting.
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
