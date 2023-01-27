import {useEffect} from "react";

const {useState} = require("react");
const {createContext} = require('react');

export const AccountContext = createContext();

function UserContext({children}) {
    const [user, setUser] = useState({loggedIn: null});

    useEffect(() => {
        fetch("http://localhost:4000/auth/login", {
            credentials: "include",
        })
            .catch(err => {
                setUser({ loggedIn: false });
                return;
            })
            .then(r => {
                if (!r || !r.ok || r.status >= 400) {
                    setUser({ loggedIn: false });
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
                console.log(data);
                console.log('logged IN');
                setUser({ ...data });

            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <AccountContext.Provider value ={{user, setUser}}>
            {children}
        </AccountContext.Provider>
    );
}
export default UserContext