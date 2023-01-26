import React, {useRef, useState, useContext} from "react";
import * as yup from 'yup';
import YupPassword from 'yup-password'
YupPassword(yup)

const Login = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState("login");
    const registerMail = useRef();
    const registerUserName = useRef();
    const registerPassword = useRef();
    const registerPasswordRepeat = useRef();
    const loginUsername = useRef();
    const loginPassword = useRef();

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const validateLoginInputs = (username, password) => {
        const formSchema = yup.object().shape({
        username: yup.string()
            .required('Username required')
            .min(6, 'Username too Short!')
            .max(28, 'Username too long!'),
            password: yup.string()
            .password()
            .required('Password required!'),
    });
        formSchema.isValid({
            'username': username,
            'password': password
        }).catch(err => {
            console.log(err);
        }).then(res => {
            if(res) {
                submitLogin(username, password);
                return;
            }
            console.log(res);
        })
    }

    const validateRegisterInputs = (username, email, password, repeatedPassword) => {
        if(repeatedPassword !== password) {
            console.log("Passwörter stimmen nicht überein");
            return false;
        }
        const formSchema = yup.object().shape({
            username: yup.string()
                .required('Username required')
                .min(6, 'Username too Short!')
                .max(28, 'Username too long!'),
            password: yup.string()
                .password()
                .required('Password required!'),
            email: yup.string()
                .email()
                .required('Email required!'),
        });
        formSchema.isValid({
            "username": username,
            "email": email,
            "password": password
        }).catch(err => {
            console.log(err);
            return;
        }).then(res => {
            if(res) {
                submitRegister(username, email, password);
                return;
            }
            console.log(res);
        });
    }

    const submitRegister = (username, email, password) => {
        fetch("http://localhost:4000/auth/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "username": username,
                "email": email,
                "password": password
            })
        }).catch(err => {
            console.log(err);
        }).then(res => {
            if(!res || !res.ok || res.status >= 400) {
                console.log(res);
            }
            return res.json();
        }).then(data => {
            if(!data) return;
            console.log(data);
        })
    }

    const submitLogin = (username, password) => {
        fetch("http://localhost:4000/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            }),
        })
            .catch(err => {
                return;
            })
            .then(res => {
                if (!res || !res.ok || res.status >= 400) {
                    return;
                }
                return res.json();
            })
            .then(data => {
                console.log(data);
                //TODO: Set User Data
            });
    }

    return (
        <div>
            <style>

            </style>
            <button onClick={handleOpen}>Login</button>
            {isOpen && (
                <div className="modal">
                    <style>
                        {`.modal {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .modal-content {
              background: #fff;
              padding: 20px;
              border-radius: 10px;
              width: 400px;
            }
            input, button {
              margin: 10px;
            }`}
                    </style>
                    <div className="modal-content">
                        <button onClick={handleClose}>Close</button>
                        {mode === "login" && (
                            <form onSubmit={() => {
                                if(validateLoginInputs(loginUsername.current.value, loginPassword.current.value)) {
                                    submitLogin(loginUsername.current.value, loginPassword.current.value);
                                }
                            }}>
                                <label>
                                    Username:
                                    <input type="text" name={'username'} ref={loginUsername}/>
                                </label>
                                <label>
                                    Password:
                                    <input type="password" name={'password'} ref={loginPassword}/>
                                </label>
                                <button type="submit">Login</button>
                                <p> Don't have an Account?</p> <a href="#" onClick={() => handleModeChange("register")}>Create one</a>
                            </form>
                        )}
                        {mode === "register" && (
                            <form onSubmit={() => {
                                validateRegisterInputs(registerUserName.current.value, registerMail.current.value, registerPassword.current.value, registerPasswordRepeat.current.value)
                            }}>
                                <label>
                                    Username:
                                    <input type="text" name={'username'} ref={registerUserName}/>
                                </label>
                                <label>
                                    Email:
                                    <input type="email" name={'email'} ref={registerMail}/>
                                </label>
                                <label>
                                    Password:
                                    <input type="password" name={'password'} ref={registerPassword}/>
                                </label>
                                <label>
                                    Repeat Password:
                                    <input type="password" name={'password'} ref={registerPasswordRepeat}/>
                                </label>
                                <button type="submit">Register</button>
                                <p> Already have an Account?</p> <a href="#" onClick={() => handleModeChange("login")}>Login</a>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
