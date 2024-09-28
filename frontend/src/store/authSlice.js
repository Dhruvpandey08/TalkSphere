import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAuth: false,
    user: null,
    otp: {
        phone: '',
        hash: '',
    },
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action) => {
            if (action.payload) {
                // Destructure user from the payload if it exists
                const { user } = action.payload;
                state.user = user;
                state.isAuth = true;
            } else {
                // Handle the case where action.payload is null (logout scenario)
                state.user = null;
                state.isAuth = false;
            }
        },
        setOtp: (state, action) => {
            const { phone, hash } = action.payload;
            state.otp.phone = phone;
            state.otp.hash = hash;
        },
    },
});

export const { setAuth, setOtp } = authSlice.actions;

export default authSlice.reducer;
