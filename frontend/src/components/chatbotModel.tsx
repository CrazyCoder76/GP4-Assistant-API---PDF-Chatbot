// Import React and necessary hooks
import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useToast } from './toast';
import apiClient from '../utils/apiClient';
interface Props {
    bot_id: string
}
interface FileItem {
    id: string;
    name: string;
}
const ChatbotModel: React.FC<Props> = ({ bot_id }) => {
    const [chatbotPrompt, setChatbotPrompt] = useState<string>('');
    const [chatbotName, setChatBotName] = useState<string>('')
    const [files, setFiles] = useState<FileItem[]>([])
    const { addToast } = useToast()
    const filePickRef = useRef<HTMLInputElement>(null)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const data = new FormData()
            data.append('id', bot_id)
            Array.from(event.target.files).forEach(file => data.append('files', file))
            addToast("Uploading files...", 'info')
            apiClient.post(`${import.meta.env.VITE_API_URL}/update_files`, data, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
                .then(response => {
                    const data = response.data
                    data.file_ids.forEach((id: string, index: number) => {
                        setFiles(prev => [...prev, { id: id, name: data.file_names[index] }])
                    })
                    // setFiles(prev => prev.filter(file => file.id != id))
                    addToast("Successfully uploaded", 'success')
                })
                .catch(error => {
                    addToast(error.response.data.message, 'error')
                })
        }
    };

    const handleDelete = (id: string) => {
        apiClient.post(`${import.meta.env.VITE_API_URL}/delete_file`, {
            id: bot_id,
            file_id: id
        })
            .then(_ => {
                setFiles(prev => prev.filter(file => file.id != id))
                addToast("Successfully deleted", 'success')
            })
            .catch(error => {
                addToast(error.response.data.message, 'error')
            })
    };

    // Handle chatbot prompt change
    const handleChatbotPromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setChatbotPrompt(event.target.value);
    };
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        apiClient.post(`${import.meta.env.VITE_API_URL}/update_model_info`, {
            id: bot_id,
            name: chatbotName,
            prompt: chatbotPrompt
        })
            .then(_ => {
                addToast("successfully updated", 'success')
            })
            .catch(error => {
                addToast(error.response.data.message, 'error')
            })
    }
    useEffect(() => {
        setFiles([])
        apiClient.post(`${import.meta.env.VITE_API_URL}/get_model_info`, {
            id: bot_id
        })
            .then((response: any) => {
                const data = response.data
                setChatbotPrompt(data.prompt)
                setChatBotName(data.name)
                console.log(data.file_ids)
                data.file_ids.forEach((id: string, index: number) => {
                    setFiles(prev => [...prev, { id: id, name: data.file_names[index] }])
                })
                console.log(files)
            })
    }, [bot_id])
    return (
        <div className="w-full h-full p-5 flex flex-col gap-3">
            <div className="prose xl:prose-xl">
                <h1>Chat Interface</h1>
            </div>
            <h3 className="font-bold text-lg">Set your chatbot model</h3>
            <form id='chatbot_form' className="form-control space-y-4" onSubmit={onSubmit}>
                <div className='flex gap-3'>
                    <input
                        type='text'
                        className='input input-bordered w-full'
                        placeholder='Chatbot Name'
                        required
                        value={chatbotName}
                        onChange={(e) => setChatBotName(e.target.value)}
                    />
                    <button className='btn btn-primary' type='submit'>Save</button>
                </div>
                <textarea
                    className="textarea textarea-bordered w-full h-[300px]"
                    placeholder="Write instruction here"
                    value={chatbotPrompt}
                    onChange={handleChatbotPromptChange}
                    required
                >
                </textarea>
            </form>
            <div className='divider' />
            <p className="font-bold text-lg">Add/Remove files</p>
            <div className="container">
                <button
                    onClick={() => filePickRef.current?.click()}
                    className="btn btn-primary mt-2">
                    Upload Files
                </button>
                <ul className="list-disc mt-4 overflow-auto max-h-[300px]">
                    {files.map(file => (
                        <li key={file.id} className="flex justify-between items-center p-2">
                            {file.name}
                            <button className="btn btn-error btn-sm" onClick={() => handleDelete(file.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
                <input ref={filePickRef} type="file" multiple onChange={handleFileChange} className="hidden" />
            </div>
        </div>
    );
};

export default ChatbotModel;
