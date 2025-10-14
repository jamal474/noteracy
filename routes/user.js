const express = require('express');
const router = express.Router();
const passport = require('passport');


router.get('/api/v1/check-auth-status', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'User is not authenticated' });
  }
});

router.get('/api/v1/fetch-profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send({
       user: req.user,
       profileImg : req.user.profileImage
       });
  } else {
    res.status(401).json({ message: 'No Profile Image' });
  }
});

module.exports = router;