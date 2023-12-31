/**
 * 認証用のプロバイダ
 */
import React from "react"
import { Route, Redirect } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function AuthFirebaseRoute({ component: Component, ...rest }) {
    const { currentUser } = useAuth()

    return (
        <Route
            {...rest}
            render={props => {
                return currentUser ? <Component {...props} /> : <Redirect to="/login" />
            }}
        ></Route>
    )
}