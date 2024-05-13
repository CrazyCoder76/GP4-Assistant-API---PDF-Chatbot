import Types from './types'
type UserData = {
    first_name: string,
    last_name: string,
    email: string,
}
export const setUserData = (data: UserData) => ({
    type: Types.SET_USER_DATA,
    payload: data
})