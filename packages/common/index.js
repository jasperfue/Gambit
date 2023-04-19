const Yup = require('yup');
require('yup-password')(Yup);

const LoginSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'Username has to be at least 3 characters long')
        .max(20, 'Username cannot be longer than 20 characters')
        .test('not_guest', 'Username cannot start with "guest"', (value) => {
            return !value.startsWith('guest');
        })
        .required('Username is a required field'),
    password: Yup.string()
        .min(8, 'Password has to be at least 8 characters long')
        .minLowercase(1, 'At least one character hat to be in lower case')
        .minUppercase(1, 'At least one character has to be in upper case')
        .minNumbers(1, 'At least on character has to be a number')
        .minSymbols(1, 'At least one character has to be a symbol')
        .minRepeating(3, 'It is only allowed to have at most 3 repeating characters')
        .required('Password is a required field'),
});

const SignUpSchema = Yup.object({
    username: Yup.string()
        .min(3, 'Username has to be at least 3 characters long')
        .max(20, 'Username cannot be longer than 20 characters')
        .test('not_guest', 'Username cannot start with "guest"', (value) => {
            return !value.startsWith('guest');
        })
        .required('Username is a required field'),
    email: Yup.string()
        .email('Invalid E-Mail')
        .required('Email is a required field'),
    password: Yup.string()
        .min(8, 'Password has to be at least 8 characters long')
        .minLowercase(1, 'At least one character hat to be in lower case')
        .minUppercase(1, 'At least one character has to be in upper case')
        .minNumbers(1, 'At least on character has to be a number')
        .minSymbols(1, 'At least one character has to be a symbol')
        .minRepeating(3, 'It is only allowed to have at most 3 repeating characters')
        .required('Password is a required field'),
    passwordRepeat: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords do not match')
        .required('Repeat password is a required field')
});

module.exports = {LoginSchema, SignUpSchema};