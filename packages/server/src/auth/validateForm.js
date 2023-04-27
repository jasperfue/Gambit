const {LoginSchema, SignUpSchema} = require('@gambit/common');

const validateLogin = (req, res, next) => {
    const formData = req.body;
    LoginSchema
        .validate(formData)
        .catch(() => {
            res.status(422).send();
        })
        .then(valid => {
            if(valid) {
                next();
            } else {
                res.status(422).send();
            }
        })
}

const validateSignUp = (req, res, next) => {
    const formData = req.body;
    SignUpSchema
        .validate(formData)
        .catch(() => {
            res.status(422).send();
        })
        .then(valid => {
            if(valid) {
                next();
            } else {
                res.status(422).send();
            }
        })
}

module.exports = {validateLogin, validateSignUp};