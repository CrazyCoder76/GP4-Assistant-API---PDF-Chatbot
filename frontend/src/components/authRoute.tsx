import { Navigate } from 'react-router-dom';

// Function to check if the user is authenticated
// Update this function based on how you handle authentication in your app
const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

const AuthRoute = ({ children }: any) => {
    return isAuthenticated() ? children :
        <Navigate
            to={{
                pathname: '/login'
            }}
        />
}

export default AuthRoute;