import React, {useEffect} from "react";

const {useState} = require("react");
const {createContext} = require('react');

export const AccountContext = createContext();

function UserContext({children}) {
    const [user, setUser] = useState({loggedIn: null, token: localStorage.getItem("token")});

    useEffect(() => {
        fetch("http://localhost:4000/auth/login", {
            credentials: "include",
            headers: {
                "authorization": `Bearer ${user.token}`
            }
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
                if (!data.loggedIn) {
                    setUser({ loggedIn: false });
                    return;
                }
                console.log('logged IN');
                setUser({ ...data });

            });
    }, []);
    return (
        <AccountContext.Provider value ={{user, setUser}}>
            {children}
        </AccountContext.Provider>
    );
}
export default UserContext