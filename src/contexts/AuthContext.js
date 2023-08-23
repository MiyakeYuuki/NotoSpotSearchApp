/**
 * Firebaseとやりとりするコンポーネント
 */
import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase"

const AuthContext = React.createContext()

// Contextの指定
export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState()
    const [loading, setLoading] = useState(true)

    // signupするための関数
    function signup(email, password) {
        return auth.createUserWithEmailAndPassword(email, password)
    }
    // loginするための関数
    function login(email, password) {
        return auth.signInWithEmailAndPassword(email, password)
    }

    // logoutするための関数
    function logout() {
        return auth.signOut();
    }

    // passwordresetするための関数
    function resetPassword(email) {
        // .env use case      url: process.env.REACT_APP_MAIL_URL + '?email=' + email,
        // local dev case     url: "http://localhost:3000/?email=" + email,
        // product case     url: "https://you-domain/?email=' + email,
        const actionCodeSettings = {
            url: "http://localhost:3000/?email=" + email
        };
        return auth.sendPasswordResetEmail(email, actionCodeSettings);
    }

    // メールアドレス有効化するための関数
    function sendEmailVerification() {
        // .env use case      url: process.env.REACT_APP_MAIL_URL + 'dashboard'
        // local dev case     url: "http://localhost:3000/dashboard"
        // product case     url: "https://you-domain/dashboard'
        const actionCodeSettings = {
            url: "http://localhost:3000/dashboard"
        };
        return currentUser.sendEmailVerification(actionCodeSettings);
    }

    // パスワード変更するための関数
    function updatePassword(password) {
        return currentUser.updatePassword(password)
    }

    // メールアドレス変更するための関数
    function updateEmail(email) {
        return currentUser.updateEmail(email)
    }

    //プロフィール変更するための関数
    function updateProfile(profiledata) {
        return currentUser.updateProfile(profiledata)
    }

    // currentUser（変数）とsignup,login（関数）を共有する
    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword,
        sendEmailVerification,
        updatePassword,
        updateEmail,
        updateProfile
    };

    useEffect(() => {
        // Firebase Authのメソッド。ログイン状態が変化すると呼び出される
        auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoading(false)
        });
    }, []);

    // app.jsなどで共有する範囲について指定
    // valueが共有する部分
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
} 