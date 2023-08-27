import React, { useReducer, useEffect, useState } from "react";
import TextField from "@material-ui/core/TextField";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import CardHeader from "@material-ui/core/CardHeader";
import Button from "@material-ui/core/Button";
import { useAuth } from "../contexts/AuthContext";
import { Link, useHistory } from "react-router-dom";
import useStyles from './../style/Styles';

//state type
type State = {
    email: string,
    password: string,
    passwordconfirm: string,
    isButtonDisabled: boolean,
    helperText: string,
    isError: boolean
};

const initialState: State = {
    email: "",
    password: "",
    passwordconfirm: "",
    isButtonDisabled: true,
    helperText: "",
    isError: false
};

type Action =
    | { type: "setEmail", payload: string }
    | { type: "setPassword", payload: string }
    | { type: "setPasswordConfirm", payload: string }
    | { type: "setIsButtonDisabled", payload: boolean }
    | { type: "loginSuccess", payload: string }
    | { type: "loginFailed", payload: string }
    // | { type: "signupSuccess", payload: string }
    // | { type: "signupFailed", payload: string }
    | { type: "setIsError", payload: boolean };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "setEmail":
            return {
                ...state,
                email: action.payload
            };
        case "setPassword":
            return {
                ...state,
                password: action.payload
            };
        case "setPasswordConfirm":
            return {
                ...state,
                passwordconfirm: action.payload
            };
        case "setIsButtonDisabled":
            return {
                ...state,
                isButtonDisabled: action.payload
            };
        case "loginSuccess":
            //case "signupSuccess":
            return {
                ...state,
                helperText: action.payload,
                isError: false
            };
        case "loginFailed":
            // case "signupFailed":
            return {
                ...state,
                helperText: action.payload,
                isError: true
            };
        case "setIsError":
            return {
                ...state,
                isError: action.payload
            };
        default:
            return state;
    }
};

const Login = () => {
    const classes = useStyles();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { login } = useAuth();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const history = useHistory();

    useEffect(() => {
        if (state.email.trim() && state.password.trim()) {
            //trigger();
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
        } else {
            //clearErrors()
            dispatch({
                type: "setIsButtonDisabled",
                payload: true
            });
        }
    }, [state.email, state.password]);

    async function handleLogin(event) {
        event.preventDefault();
        try {
            setError("");
            setSuccessMessage("");
            //sing up ボタンの無効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: true
            });
            await login(state.email, state.password);
            dispatch({
                type: "loginSuccess",
                payload: "Login Successfully"
            });
            //Loginボタンの有効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
            setSuccessMessage("ログインに成功しました");
            history.push("/dashboard");
        } catch (e) {
            console.log(e);
            //エラーのメッセージの表示
            switch (e.code) {
                case "auth/network-request-failed":
                    setError(
                        "通信がエラーになったのか、またはタイムアウトになりました。通信環境がいい所で再度やり直してください。"
                    );
                    break;
                case "auth/weak-password": //バリデーションでいかないようにする
                    setError("パスワードが短すぎます。6文字以上を入力してください。");
                    break;
                case "auth/invalid-email": //バリデーションでいかないようにする
                    setError("メールアドレスまたはパスワードが正しくありません");
                    break;
                case "auth/wrong-password":
                    setError("メールアドレスまたはパスワードが正しくありません");
                    break;
                case "auth/user-disabled":
                    setError("入力されたメールアドレスは無効（BAN）になっています。");
                    break;
                default:
                    //想定外
                    setError(
                        "ログインに失敗しました。通信環境がいい所で再度やり直してください。"
                    );
            }
            //sing up ボタンの有効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
        }
    }


    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.keyCode === 13 || event.which === 13) {
            state.isButtonDisabled || handleLogin();
        }
    };

    const handleEmailChange: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        dispatch({
            type: "setEmail",
            payload: event.target.value
        });
    };

    const handlePasswordChange: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        dispatch({
            type: "setPassword",
            payload: event.target.value
        });
    };

    return (
        <form className={classes.container} noValidate autoComplete="off">
            <Card className={classes.card}>
                <CardHeader className={classes.header} title="Login" />
                <CardContent>
                    <div>
                        {error && <div variant="danger">{error}</div>}
                        {successMessage && <div variant="danger">{successMessage}</div>}
                        <TextField
                            error={state.isError}
                            fullWidth
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="Email"
                            margin="normal"
                            onChange={handleEmailChange}
                            onKeyPress={handleKeyPress}
                        />
                        <TextField
                            error={state.isError}
                            fullWidth
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Password"
                            margin="normal"
                            helperText={state.helperText}
                            onChange={handlePasswordChange}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    もしアカウントがないなら<Link to="/signup">こちら</Link>
                    からアカウントを作成してください。<br></br>パスワードを忘れた方は
                    <Link to="/forgotPassword">こちら</Link>から初期化をおこなってください
                </CardContent>
                <CardActions>
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        className={classes.Btn}
                        onClick={handleLogin}
                        disabled={state.isButtonDisabled}
                    >
                        Login
                    </Button>
                </CardActions>
            </Card>
        </form>
    );
};

export default Login;