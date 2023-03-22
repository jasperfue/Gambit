import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';
import { BrowserRouter } from "react-router-dom";
import {ChakraProvider, ColorModeScript} from '@chakra-ui/react'
import customTheme from "./theme.js";
import '@fontsource/exo-2/400.css'
import '@fontsource/exo-2/500.css'
import '@fontsource/exo-2/600.css'
import '@fontsource/exo-2/700.css'

const root = ReactDOM.createRoot(document.getElementById('root'));



root.render(
  <React.StrictMode>
      <BrowserRouter>
          <ChakraProvider theme={customTheme}>
              <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
              <App/>
          </ChakraProvider>
      </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
