import React, {useEffect, useState, createContext} from "react";
export const AccountContext = createContext();

const UserContext = ({children}) => {
    const [user, setUser] = useState({loggedIn: null});

    /**
     * Set User with Cookie, if possible
     */
    useEffect(() => {
        fetch("http://localhost:4000/auth/login", {
            credentials: "include",
        })
            .catch(err => {
                console.log(err);
                return;
            })
            .then(r => {
                if (!r || !r.ok || r.status >= 400) {
                    return;
                }
                return r.json();
            })
            .then(data => {
                setUser({ ...data});
            });
    }, []);
    return (
        <AccountContext.Provider value ={{user, setUser}}>
            {children}
        </AccountContext.Provider>
    );
}
export default UserContext;