import React, {useState, useContext} from "react";
import { Formik, Form, Field, ErrorMessage, useFormik } from 'formik';
import {AccountContext} from "../AccountContext.js";
import {LoginSchema, SignUpSchema} from "@gambit/common"

const Login = () => {
    const {setUser} = useContext(AccountContext);
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState("login");
    const [loginError, setLoginError] = useState(null);
    const [signUpError, setSignUpError] = useState(null);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };


        const submitSignUp = (values) => {
        fetch("http://localhost:4000/auth/signup", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values)
        }).catch(err => {
            console.log(err);
        }).then(res => {
            if(!res || !res.ok || res.status >= 400) {
                console.log(res);
            }
            return res.json();
        }).then(data => {
            if(!data.loggedIn) {
                setSignUpError(data.message);
                return;
            }
            setUser({...data});
            setSignUpError(null);
            console.log(data);
        })
    }

    const submitLogin = (values) => {
        fetch("http://localhost:4000/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values)
        })
            .catch(err => {
                console.log(err);
                return;
            })
            .then(res => {
                console.log(res);
                if (!res || !res.ok || res.status >= 400) {
                    return;
                }
                return res.json();
            })
            .then(data => {
                if(!data.loggedIn) {
                    setLoginError(data.message);
                    return;
                }
                setUser({...data});
                setLoginError(null);
                console.log(data);
            });
    }

    return (
        <div>
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
              position: relative;
              background: #fff;
              padding: 20px;
              border-radius: 10px;
              width: 400px;
            }
            .close {
                position: absolute;
                top: 0;
                right: 0;
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
            }

            .close:hover,
            .close:focus {
                color: black;
                text-decoration: none;
                   cursor: pointer;
            }
            .field {
                margin-bottom: 10px;
            }

            `}
                    </style>
                    <div className="modal-content">
                        <button type="button" className="close" aria-label="Close" onClick={handleClose}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                        {mode === "login" && (
                            <Formik
                                initialValues={{
                                    username: '',
                                    password: '',
                                }}
                                validationSchema={LoginSchema}
                                onSubmit={values => {
                                    submitLogin(values);
                                }}
                            >
                                {({ isValid, isSubmitting }) => (
                                    <Form>
                                        <div className='field'>
                                            <Field name="username" type="text" placeholder="Username"/>
                                            <ErrorMessage name="username" component="div" />
                                        </div>
                                        <div className='field'>
                                            <Field name="password" type="password" placeholder="Password" />
                                            <ErrorMessage name="password" component="div" />
                                        </div>
                                        <div> {loginError} </div>
                                        <button type="Log In" disabled={!isValid || isSubmitting}>Submit</button>
                                        <p> Don't have an Account?</p> <a href="#" onClick={() => handleModeChange("signUp")}>Sign Up</a>
                                    </Form>
                                )}
                            </Formik>
                        )}
                        {mode === "signUp" && (
                            <Formik
                                initialValues={{
                                    username: '',
                                    email: '',
                                    password: '',
                                    passwordRepeat: ''
                                }}
                                validationSchema={SignUpSchema}
                                onSubmit={(values, { setSubmitting }) => {
                                    // Hier können Sie Ihre Formulardaten verarbeiten, z.B. an eine API senden
                                    submitSignUp(values);
                                    setSubmitting(false);
                                }}
                            >
                                {({ isValid, isSubmitting }) => (
                                    <Form>
                                        <div className='field'>
                                            <Field name="username" placeholder="Username" />
                                            <ErrorMessage name="username" component="div"/>
                                        </div>
                                        <div className='field'>
                                            <Field name="email" type="email" placeholder="Email" />
                                            <ErrorMessage name="email" component="div"/>
                                        </div>
                                        <div className='field'>
                                            <Field name="password" type="password" placeholder="Password" />
                                            <ErrorMessage name="password" component="div"/>
                                        </div>
                                        <div className='field'>
                                            <Field name="passwordRepeat" type="password" placeholder="Repeat password" />
                                            <ErrorMessage name="passwordRepeat" component="div"/>
                                        </div>
                                        <div> {signUpError} </div>
                                        <button type="submit" disabled={!isValid || isSubmitting} >Sign Up</button>
                                        <p> Already have an Account?</p> <a href="#" onClick={() => handleModeChange("login")}>Log in</a>
                                    </Form>
                                )}
                            </Formik>

                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
