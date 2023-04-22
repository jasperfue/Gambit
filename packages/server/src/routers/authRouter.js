const express = require('express');
const router = express.Router();
const {handleLogout, handleLogin, attemptLogin, attemptSignUp} = require('../auth/authController.js');
const {validateSignUp, validateLogin} = require('../auth/validateForm.js')
const {rateLimiter} = require('../auth/rateLimiter.js')


router.route('/login').get(handleLogin).post(validateLogin,rateLimiter(60, 10), attemptLogin);


router.post('/signup', validateSignUp, rateLimiter(60, 10), attemptSignUp);

router.route('/logout').get(handleLogout);

module.exports = router;