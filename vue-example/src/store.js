import Store from '../store'
const store = new Store({
    state: {
        name: "Jamie",
        test: "Pulse is cool",
        theme: "dark"
    },
    mutations: {
        changeName({
            state
        }, val) {
            state.name = val;
        },
        changeTheme({
            state
        }) {
            if (state.theme === "light") {
                state.theme = "dark";
            } else {
                state.theme = "light";
            }
        }
    },
})

export default store