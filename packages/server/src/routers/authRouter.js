const express = require('express');
const router = express.Router();
const {handleLogout, handleLogin, attemptLogin, attemptSignUp} = require('../auth/authController.js');
const {validateSignUp, validateLogin} = require('../auth/validateForm.js')
const {rateLimiter} = require('../auth/rateLimiter.js')


router.route('/login').get(rateLimiter(60, 10), handleLogin).post(rateLimiter(60, 10), validateLogin, attemptLogin);


router.post('/signup', validateSignUp, rateLimiter(60, 10), attemptSignUp);

router.get('/logout', handleLogout);

module.exports = router;