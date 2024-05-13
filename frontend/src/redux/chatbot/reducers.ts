import types from "./types"

interface Chatbot {
    id: string,
    name: string,
}
interface InitialState {
    chatbots: Chatbot[],
}
interface Action {
    type: string,
    payload: any
}
const initialState: InitialState = {
    chatbots: []
}
const reducer = (state = initialState, action: Action) => {
    switch (action.type) {
        case types.ADD_CHATBOT:
            return {
                chatbots: [
                    ...state.chatbots,
                    action.payload
                ]
            }
        case types.LOAD_CHATBOTS:
            return {
                chatbots: action.payload
            }
        default:
            return state
    }
}
export default reducer