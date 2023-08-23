import React from "react";
import Signup from "./Signup";
import Home from "./Home"
import Dashboard from "./Dashboard"
import Login from "./Login"
//ログイン認証
import AuthFirebaseRoute from "./AuthFirebaseRoute";
import ForgotPassword from "./ForgotPassword";
import UpdateProfile from "./UpdateProfile";

import { AuthProvider } from "../contexts/AuthContext"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"

function App() {
  return (
    <Router>
      {/* 以下の範囲が共有できる部分．Signupのコンポーネント内でContextが使用できる */}
      <AuthProvider>
        <Switch>
          <Route path="/signup" component={Signup} />
          <Route path="/forgotPassword" component={ForgotPassword} />
          <Route exact path="/" component={Home} />
          <Route path="/login" component={Login} />
          <AuthFirebaseRoute path="/dashboard" component={Dashboard} />
          <AuthFirebaseRoute path="/updateprofile" component={UpdateProfile} />
        </Switch>
      </AuthProvider>
    </Router>
  );
}
export default App;
