const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async function (accessToken, refreshToken, profile, done) {
        const newUser = {
            googleId: profile.id,
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profileImage: profile.photos[0].value
        }
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                done(null, user);
            }
            else {
                user = await User.create(newUser);
                done(null, user);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
));

router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

const successLoginUrl = `${process.env.CLIENT_URL}/dashboard`
const errorLoginUrl = `/error`

router.get('/google/callback',
    passport.authenticate('google', { 
        failureMessage: "Cannot Login, Please Try Again Later!",
        failureRedirect: errorLoginUrl,
        successRedirect : successLoginUrl 
    }),
    function (req, res) {
        res.send("Thank You for signing in!");
    });

router.get('/logout', (req,res) => {
    req.session.destroy(error => {
        if(error) {
            console.log(error);
            res.send('Error logging out');
        }
        else
        {
            res.clearCookie('connect.sid');
            res.redirect(`${process.env.CLIENT_URL}`);
        }
    })
})


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
})


module.exports = router;