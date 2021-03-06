module.exports = {
    "env": {
        "browser": true,
        "es2020": true,
        "jest": true
    }, "extends": ["eslint:recommended", "plugin:react/recommended"], "parserOptions": { "ecmaFeatures": { "jsx": true }, "ecmaVersion": 11, "sourceType": "module" }, "plugins": ["react"], "rules": {
        "react/prop-types": 0,
        "react/display-name": 0,
        "react/react-in-jsx-scope": 0,
        "react/no-unescaped-entities": 0
    }, "settings": { "react": { "version": "detect" } }
};
