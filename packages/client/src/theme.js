
import { extendTheme } from "@chakra-ui/react";

const colors = {
    primary: {
        500: "#FFFBF4",
    },
    secondary: {
        500: "#333333",
    },
    tertiary: {
        500: "#674520", // Ein passender Braunton
    },
    quaternary: {
        500: "#FFEBCE",
    },
};

const config = {
    initialColorMode: "light",
    useSystemColorMode: false,
};


const customTheme = extendTheme({
    colors,
    config,
    // Weitere Theme-Anpassungen hier
});

export default customTheme;
