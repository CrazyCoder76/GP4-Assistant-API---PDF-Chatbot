import { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useToast } from '../../components/toast';
import { useDispatch } from 'react-redux';
import { setUserData } from '../../redux/auth/actions';
import apiClient from '../../utils/apiClient';
const Login = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { addToast } = useToast()
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data: any = e.currentTarget.elements
        apiClient.post(`${import.meta.env.VITE_API_URL}/login`, {
            email: data['email'].value,
            password: data['password'].value
        })
            .then(response => {
                const { token } = response.data
                localStorage.setItem('token', token)
                axios.interceptors.request.use(config => {
                    config.headers['Authorization'] = `Bearer ${token}`
                    return config
                }, error => Promise.reject(error))
                navigate('/')
            })
            .catch(reason => {
                addToast(reason.response.data.message, 'error')
            })
    }
    const responseMessage = (response: CredentialResponse) => {
        console.log(response)
        apiClient.post(`${import.meta.env.VITE_API_URL}/oauth`, {
            credential: response.credential
        })
            .then(response => {
                const { token, user } = response.data
                localStorage.setItem('token', token)
                dispatch(setUserData(user))
                navigate('/')
            })
            .catch(reason => {
                addToast(reason.response.data.message, 'error')
            })
    };
    const errorMessage = () => {
        // console.log(error);
    };
    return (
        <div className='h-[100vh] flex flex-col items-center justify-center gap-3'>
            <div className='prose lg:prose-xl m-3'>
                <h1>Login to your account</h1>
            </div>
            <form className='form-control gap-3' onSubmit={onSubmit}>
                <label className="input input-bordered flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" /><path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" /></svg>
                    <input type="email" name='email' required className="grow" placeholder="Email" />
                </label>
                <label className="input input-bordered flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" /></svg>
                    <input name='password' type="password" required className="grow" placeholder='Password' />
                </label>
                <button type='submit' className='btn btn-primary'>
                    Sign In
                </button>
            </form>
            <div>
                Not registered yet? <Link to='/register'>Register</Link>
            </div>
            <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
        </div>
    )
}

export default Login