const express = require('express');
const router = express.Router();
const passport = require('passport');


router.get('/api/v1/check-auth-status', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'User is not authenticated' });
  }
});

module.exports = router;