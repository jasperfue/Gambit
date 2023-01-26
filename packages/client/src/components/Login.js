import React, {useRef, useState} from "react";

const Login = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState("login");
    const registerMail = useRef();
    const registerUserName = useRef();
    const registerPassword = useRef();

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const validateInputs = (username, email, password) => {
        // Email validation
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            alert("Please enter a valid email address.");
            return false;
        }

        // Password validation
        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return false;
        }
        // Uppercase letter
        if (!/[A-Z]/.test(password)) {
            alert("Password must contain at least one uppercase letter.");
            return false;
        }
        // Lowercase letter
        if (!/[a-z]/.test(password)) {
            alert("Password must contain at least one lowercase letter.");
            return false;
        }
        // Number
        if (!/\d/.test(password)) {
            alert("Password must contain at least one number.");
            return false;
        }
        // Special character
        if (!/[^a-zA-Z0-9]/.test(password)) {
            alert("Password must contain at least one special character.");
            return false;
        }


        // Additional validation rules can be added here

        return true;
    };

    const submitRegister = (username, email, password) => {
        fetch("http://localhost:3000/auth/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: {
                "username": username,
                "email": email,
                "password": password
            }
        }).catch(err => {
            return;
        }).then(res => {
            if(!res || !res.ok || res.status >= 400) {
                return;
            }
            return res.json();
        }).then(data => {
            if(!data) return;
            console.log(data);
        })
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
                            <form>
                                <label>
                                    Email:
                                    <input type="email" />
                                </label>
                                <label>
                                    Password:
                                    <input type="password" />
                                </label>
                                <button type="submit">Login</button>
                                <p> Don't have an Account?</p> <a href="#" onClick={() => handleModeChange("register")}>Create one</a>
                            </form>
                        )}
                        {mode === "register" && (
                            <form onSubmit={() => {
                                if(validateInputs(registerUserName.current.value, registerMail.current.value, registerPassword.current.value)) {
                                    submitRegister(registerUserName.current.value, registerMail.current.value, registerPassword.current.value);
                                }
                            }}>
                                <label>
                                    Username:
                                    <input type="text" ref={registerUserName}/>
                                </label>
                                <label>
                                    Email:
                                    <input type="email" ref={registerMail}/>
                                </label>
                                <label>
                                    Password:
                                    <input type="password" ref={registerPassword}/>
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
