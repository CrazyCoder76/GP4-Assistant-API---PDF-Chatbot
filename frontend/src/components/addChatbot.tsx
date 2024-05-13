// Import React and necessary hooks
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useToast } from './toast';
import { useDispatch } from 'react-redux';
import { addChatbot } from '../redux/chatbot/actions';
import apiClient from '../utils/apiClient';

const AddChatBot: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [chatbotPrompt, setChatbotPrompt] = useState<string>('');
    const [chatbotName, setChatBotName] = useState<string>('')
    const { addToast } = useToast()
    const dispatch = useDispatch()

    // Handle file selection
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(Array.from(event.target.files));
        } else setFiles([])
    };

    // Handle chatbot prompt change
    const handleChatbotPromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setChatbotPrompt(event.target.value);
    };

    const createBotClicked = () => {
        document.getElementById('submit_btn')?.click()
    }
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        formData.append('prompt', chatbotPrompt)
        formData.append('name', chatbotName)

        apiClient.post(`${import.meta.env.VITE_API_URL}/add_bot`, formData, {
            headers: {
                "Content-Type": 'multipart/form-data'
            }
        })
            .then(response => {
                console.log(response)
                dispatch(addChatbot(response.data))
                document.getElementById('close_btn')?.click()
            })
            .catch(error => {
                addToast(error.response.data.message, 'error')
            })
    }
    return (
        <>
            <label htmlFor="my_modal_6" className="btn btn-primary">
                <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
                </svg>
                Create New
            </label>
            <input type="checkbox" id="my_modal_6" className="modal-toggle" />
            <div className="modal" role="dialog">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Create your own chatbot</h3>
                    <form id='chatbot_form' className="form-control p-4 space-y-4" onSubmit={onSubmit}>
                        <input
                            type='text'
                            className='input input-bordered w-full'
                            placeholder='Chatbot Name'
                            required
                            onChange={(e) => setChatBotName(e.target.value)}
                        />
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className='file-input w-full'
                        />
                        <textarea
                            className="textarea textarea-bordered w-full h-[300px]"
                            placeholder="Write instruction here"
                            value={chatbotPrompt}
                            onChange={handleChatbotPromptChange}
                            required
                        >
                        </textarea>
                        <button id='submit_btn' type='submit' hidden />
                    </form>
                    <div className="modal-action">
                        <button className='btn' onClick={createBotClicked}>Create</button>
                        <label htmlFor="my_modal_6" id='close_btn' className="btn">Close</label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddChatBot;
