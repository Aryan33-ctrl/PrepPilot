import React from 'react'
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";

const Protected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loader-spinner'>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                </div>
                <h1>Authenticating Workspace Session...</h1>
            </main>
        )
    }

    if (!user) {
        return <Navigate to={'/login'} replace />
    }

    return children
}

export default Protected