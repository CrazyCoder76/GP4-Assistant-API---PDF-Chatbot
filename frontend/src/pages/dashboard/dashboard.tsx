import { useState } from 'react'
import ChatComponent from '../../components/chatComponent'
import Leftsidebar from '../../components/leftSideBar'
import { useToast } from '../../components/toast'
import apiClient from '../../utils/apiClient'
import ChatbotInterface from '../../components/chatbotInterface'
import ChatbotModel from '../../components/chatbotModel'
const Dashboard = () => {
    const { addToast } = useToast()
    const [session_id, setSessionId] = useState<string>()
    const [bot_id, setBotId] = useState<string>('')
    const [mode, setMode] = useState<number>(0)
    const onSelectChatbot = (id: string) => {
        apiClient.post(`${import.meta.env.VITE_API_URL}/create_session`, {
            chatbot_id: id
        })
            .then(response => {
                setMode(0)
                setSessionId(response.data)
            })
            .catch(reason => {
                addToast(reason.response.data.message, 'error')
            })
    }
    const onChatbotInterface = (id: string) => {
        setMode(1)
        setBotId(id)
    }
    const onChatbotModel = (id: string) => {
        setMode(2)
        setBotId(id)
    }
    return (
        <>
            <div className="flex h-[100vh]">
                {/* <div className='sm:block hidden'> */}
                <Leftsidebar
                    onSelectChatbot={onSelectChatbot}
                    onChatbotInterface={onChatbotInterface}
                    onChatbotModel={onChatbotModel} />
                {/* </div> */}
                {/* <div className='absolute drawer z-10 sm:hidden h-[100vh]'>
                    <input id="my-drawer" type="checkbox" className="drawer-toggle" />
                    <div className='drawer-content'>
                        <label htmlFor="my-drawer" className="btn btn-primary drawer-button m-3">...</label>
                    </div>
                    <div className='drawer-side'>
                        <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                        <Leftsidebar />
                    </div>
                </div> */}
                {
                    mode == 0 && session_id &&
                    <ChatComponent session_id={session_id} />
                }
                {
                    mode == 1 && bot_id &&
                    <ChatbotInterface bot_id={bot_id} />
                }
                {
                    mode == 2 && bot_id &&
                    <ChatbotModel bot_id={bot_id} />
                }
            </div>
        </>
    )
}

export default Dashboard