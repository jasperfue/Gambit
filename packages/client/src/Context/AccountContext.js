import React, {useEffect} from "react";

const {useState} = require("react");
const {createContext} = require('react');

export const AccountContext = createContext();

function UserContext({children}) {
    const [user, setUser] = useState({loggedIn: null, token: null});

    useEffect(() => {
        fetch("http://localhost:4000/auth/login", {
            credentials: "include",
        })
            .catch(err => {
                return;
            })
            .then(r => {
                if (!r || !r.ok || r.status >= 400) {
                    console.log('not logged In');
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
export default UserContext