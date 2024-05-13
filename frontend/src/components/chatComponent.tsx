import React, { KeyboardEvent, useEffect, useRef, useState } from "react"
import ReactMarkdown from 'react-markdown'
import apiClient from "../utils/apiClient"
import OpenAI from 'openai'
import { useToast } from "./toast"
import ChatbotImage from '../assets/icons8-chatbot-94.png'
interface Props {
    session_id: string | undefined
}
interface Messsage {
    message: string,
    from: 'user' | 'ai'
}
const ChatComponent: React.FC<Props> = ({ session_id }) => {
    const [content, setContent] = useState<string>("")
    const { addToast } = useToast()
    const dummy = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<Messsage[]>([])

    const [suggested, setSuggested] = useState<string>("")
    const [placeholder, setPlaceholder] = useState<string>("")
    const [imageSrc, setImageSrc] = useState('')
    const [color, setColor] = useState("#aabbcc")
    const [useCustom, setUseCustom] = useState(false)
    const appendMessage = (text: string) => {
        setMessages(prev =>
            prev.map((msg, index, arr) => index == arr.length - 1 ? {
                from: msg.from,
                message: msg.message + text
            } : msg)
        )
    }
    useEffect(() => {
        apiClient.post(`${import.meta.env.VITE_API_URL}/chatbot_setting_session`, {
            id: session_id
        })
            .then((response) => {
                const data = response.data
                console.log(data.use_custom)
                setSuggested(data.suggested)
                setMessages([{ from: 'ai', message: data.initial }])
                setPlaceholder(data.placeholder)
                setUseCustom(data.use_custom)
                setColor(data.bot_msg_bg_color)
                if (data.img_id) {
                    setImageSrc(`${import.meta.env.VITE_API_URL}/avatar/${data.img_id}`)
                }
            })
    }, [session_id])
    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key == 'Enter' && content) {

            apiClient.post(`${import.meta.env.VITE_API_URL}/get_ai_response`, {
                message: content,
                session_id: session_id
            })
                .then(response => {
                    setMessages(prev => [
                        ...prev, {
                            message: content,
                            from: 'user'
                        }
                    ])
                    const openai = new OpenAI({
                        apiKey: response.data.key,
                        dangerouslyAllowBrowser: true
                    })
                    openai.beta.threads.runs
                        .createAndStream(session_id || '', {
                            assistant_id: response.data.assistant_id,
                        })
                        .on('messageCreated', (_) => setMessages(prev => [
                            ...prev, {
                                message: '',
                                from: 'ai'
                            }
                        ]))
                        .on('textDelta', (textDelta) => appendMessage(textDelta.value || ''))
                        .on('toolCallDelta', (toolCallDelta) => {
                            if (toolCallDelta.type === 'code_interpreter') {
                                if (toolCallDelta.code_interpreter?.input) {
                                    appendMessage(toolCallDelta.code_interpreter.input)
                                }
                                if (toolCallDelta.code_interpreter?.outputs) {
                                    appendMessage('output > \n')
                                    toolCallDelta.code_interpreter.outputs.forEach((output) => {
                                        if (output.type === 'logs') {
                                            appendMessage(`\n${output.logs}\n`)
                                        }
                                    });
                                }
                            }
                        });
                })
                .catch(errror => {
                    addToast(errror.response.data.message, 'error')
                })
            setContent('')
        }
    }

    useEffect(() => {
        dummy.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        setMessages([])
        setContent('')
    }, [session_id])

    return (
        <div className='w-full h-full p-5 flex flex-col gap-3'>
            <div className="overflow-auto h-full">
                {
                    messages.map((message, index) => (
                        <div key={index} className={`chat ${message.from == 'user' ? 'chat-end' : 'chat-start'}`}>
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                    <img
                                        alt="Chatbot avatar image component"
                                        src={
                                            message.from == 'ai' ? (imageSrc ? imageSrc : ChatbotImage)
                                                : "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                                        } />

                                </div>
                            </div>
                            <div
                                style={message.from == 'ai' ? { backgroundColor: useCustom ? color : 'var(--fallback-pc,oklch(var(--pc)/var(--tw-bg-opacity)))' } : {}}
                                className={`chat-bubble ${message.from == 'ai' ? "bg-primary-content" : "bg-secondary-content"}`}>
                                <ReactMarkdown className='prose lg:prose-xl max-w-none'>
                                    {message.message}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))
                }
                <div ref={dummy}></div>
            </div>

            <div className="flex gap-3 flex-wrap py-3">
                {
                    suggested.split('\n').map((val, index) => val ?
                        <button key={index} className="btn btn-primary">
                            {val}
                        </button>
                        : null)
                }
            </div>
            <div>
                <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    type="text"
                    className='input input-bordered w-full'
                    placeholder={placeholder}
                    onKeyDown={onKeyDown}
                />
            </div>
        </div>
    )
}

export default ChatComponent