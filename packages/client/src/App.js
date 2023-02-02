import React, {useEffect} from "react";
import UserContext from "./AccountContext.js";
import Views from "./Views.js";

function App() {

useEffect(() => {
    console.log('App');
}, []);
  return (
          <UserContext>
              <Views />
          </UserContext>
  );
}

export default App;
