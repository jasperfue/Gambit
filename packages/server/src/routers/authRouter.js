const express = require('express');
const router = express.Router();
const {handleLogout, handleLogin, attemptLogin, attemptSignUp} = require('../auth/authController.js');
const {validateSignUp, validateLogin} = require('../auth/validateForm.js')
const {rateLimiter} = require('../auth/rateLimiter.js')


router.use(rateLimiter(60, 10));

router.route('/login').get(handleLogin).post(validateLogin, attemptLogin);

router.post('/signup', validateSignUp, attemptSignUp);

router.get('/logout', handleLogout);

module.exports = router;