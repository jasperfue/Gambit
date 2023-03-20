
import { extendTheme } from "@chakra-ui/react";

const overrides = {
    components: {
        Input: {
            baseStyle: {
                focusBorderColor: "purple.500",
            },
        },
        PasswordInput: {
            baseStyle: {
                focusBorderColor: "purple.500",
            }
        }
    }
}

const colors = {
    brown: {
        100: "#d9d0b4",
        200: "#ccbf9a",
        500: "#7d6b57",
        700: "#5f5330",
    },
    green: {
        200: "#879e82",
        500: "#666b5e",
        700: "#292b26",
    },
    tertiary: {
        500: "#7d6b57",
    },
    quaternary: {
        500: "#ccbf9a",
    },

   /* black: {
        500: "#191835",
    },

    purple: {
        500: "#7876fd",
    },

    blue : {
        500: "#4DB1FF",
    },

    gray : {
        500: "#77838F"
    },



    background_light: {
        500: "#879e82",
    },

    background_dark: {
        500: "#292b26",
    },*/

};

const config = {
    initialColorMode: "light",
    useSystemColorMode: false,
};


const customTheme = extendTheme({
    overrides,
    colors,
    config,
    // Weitere Theme-Anpassungen hier
});

export default customTheme;
