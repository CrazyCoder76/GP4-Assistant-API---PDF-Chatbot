import { googleLogout } from "@react-oauth/google"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import React, { useEffect } from "react"
import axios from "axios"
import { loadChatbots } from "../redux/chatbot/actions"
import { setUserData } from "../redux/auth/actions"
import apiClient from "../utils/apiClient"
import AddChatBot from "./addChatbot"
import { useToast } from "./toast"

interface Props {
    onSelectChatbot: (id: string) => void,
    onChatbotInterface: (id: string) => void,
    onChatbotModel: (id: string) => void,
}
const Leftsidebar: React.FC<Props> = ({ onSelectChatbot, onChatbotInterface, onChatbotModel }) => {
    const me = useSelector((state: any) => state.AuthReducer.user)
    const chatbots = useSelector((state: any) => state.ChatbotReducer.chatbots)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { addToast } = useToast()
    const logout = () => {
        localStorage.removeItem('token')
        axios.interceptors.request.use(config => {
            config.headers['Authorization'] = ""
            return config
        }, error => Promise.reject(error))
        navigate('/login')
        googleLogout()
    }
    useEffect(() => {
        apiClient.post(`${import.meta.env.VITE_API_URL}/user_info`)
            .then(response => {
                dispatch(setUserData(response.data))
            })
            .catch(error => {
                addToast(error.response.data.message, 'error')
            })
        apiClient.post(`${import.meta.env.VITE_API_URL}/chatbot_list`)
            .then(response => {
                dispatch(loadChatbots(response.data))
            })
            .catch(error => {
                addToast(error.response.data.message, 'error')
            })
    }, [])
    return (
        <div className="flex flex-col w-[350px] bg-primary-content p-3 h-full">
            <div className="dropdown dropdown-right ">
                <div tabIndex={0}
                    role="button"
                    className="flex items-center justify-center  gap-3 hover:bg-base-300 rounded-full">
                    <div className="avatar">
                        <div className="w-12 rounded-full">
                            <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
                        </div>
                    </div>
                    <p>
                        {me.first_name} {me.last_name}
                    </p>
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a>Profile</a></li>
                    <li onClick={logout}><a>Logout</a></li>
                </ul>
            </div>
            <div className="divider my-1" />
            <AddChatBot />
            <div className="flex flex-col mt-3 gap-2">
                {
                    chatbots.map((bot: any, index: number) =>
                        <div
                            className="flex flex-row gap-1"
                            key={index}>
                            <button
                                className="btn btn-outline flex-1"
                                onClick={() => onSelectChatbot(bot.id)}>
                                {bot.name}
                            </button>

                            <div className="dropdown dropdown-right ">
                                <div tabIndex={0}
                                    className="flex items-center justify-center gap-3 rounded-full">
                                    <button
                                        className="btn btn-ghost">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px">
                                            <path fill="currentColor" d="M 9.6679688 2 L 9.1757812 4.5234375 C 8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531 L 4.5058594 4.9785156 L 2.1738281 9.0214844 L 4.1132812 10.707031 C 4.0445153 11.128986 4 11.558619 4 12 C 4 12.441381 4.0445153 12.871014 4.1132812 13.292969 L 2.1738281 14.978516 L 4.5058594 19.021484 L 6.9296875 18.185547 C 7.5961042 18.732596 8.3550224 19.166199 9.1757812 19.476562 L 9.6679688 22 L 14.332031 22 L 14.824219 19.476562 C 15.644978 19.166199 16.403896 18.732596 17.070312 18.185547 L 19.494141 19.021484 L 21.826172 14.978516 L 19.886719 13.292969 C 19.955485 12.871014 20 12.441381 20 12 C 20 11.558619 19.955485 11.128986 19.886719 10.707031 L 21.826172 9.0214844 L 19.494141 4.9785156 L 17.070312 5.8144531 C 16.403896 5.2674041 15.644978 4.8338012 14.824219 4.5234375 L 14.332031 2 L 9.6679688 2 z M 12 8 C 14.209 8 16 9.791 16 12 C 16 14.209 14.209 16 12 16 C 9.791 16 8 14.209 8 12 C 8 9.791 9.791 8 12 8 z" />
                                        </svg>
                                    </button>
                                </div>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li onClick={() => { onChatbotInterface(bot.id) }}><a>Interface</a></li>
                                    <li onClick={() => { onChatbotModel(bot.id) }}><a>Model</a></li>
                                </ul>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default Leftsidebar