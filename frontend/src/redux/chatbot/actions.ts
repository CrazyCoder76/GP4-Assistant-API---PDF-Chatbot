import Types from './types'
type Chatbot = {
    name: string,
    // prompt: string,
}
export const addChatbot = (data: Chatbot) => ({
    type: Types.ADD_CHATBOT,
    payload: data
})
export const loadChatbots = (data: Chatbot[]) => ({
    type: Types.LOAD_CHATBOTS,
    payload: data
})