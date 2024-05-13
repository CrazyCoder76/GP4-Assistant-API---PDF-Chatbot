import types from "./types"
interface InitialState {
    user: any,
}
interface Action {
    type: string,
    payload: any
}
const initialState: InitialState = {
    user: {
    }
}
const reducer = (state = initialState, action: Action) => {
    switch (action.type) {
        case types.SET_USER_DATA:
            return { user: action.payload }
        default:
            return state
    }
}
export default reducer