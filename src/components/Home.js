import React from 'react'
import { Link } from "react-router-dom"
import "../style/StyleHome.css"; // Dashboard.css をインポート

const Home = () => {
    return (
        <div className="home-container"> {/* home-container クラスを適用 */}
            <div className="home-title">Welcome to 能登観光アプリ</div>
            <div className="home-links"> {/* home-links クラスを適用 */}
                <Link to="/login" className="home-link">Login</Link> {/* home-link クラスを適用 */}
                <Link to="/signup" className="home-link">Signup</Link> {/* home-link クラスを適用 */}
            </div>
        </div>
    )
}

export default Home