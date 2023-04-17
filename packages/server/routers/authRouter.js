const express = require('express');
const router = express.Router();
const {handleLogout, handleLogin, attemptLogin, attemptSignUp} = require('../controllers/authController.js');
const {validateSignUp, validateLogin} = require('../controllers/validateForm.js')
const {rateLimiter} = require('../controllers/rateLimiter.js')


router.route('/login').get(handleLogin).post(validateLogin,rateLimiter(60, 10), attemptLogin);


router.post('/signup', validateSignUp, rateLimiter(60, 10), attemptSignUp);

router.route('/logout').get(handleLogout);

module.exports = router;