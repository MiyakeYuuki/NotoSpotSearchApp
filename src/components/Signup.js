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
    | { type: "signupSuccess", payload: string }
    | { type: "signupFailed", payload: string }
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
        case "signupSuccess":
            return {
                ...state,
                helperText: action.payload,
                isError: false
            };
        case "signupFailed":
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

const Signup = () => {
    const classes = useStyles();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { signup } = useAuth();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const history = useHistory();

    useEffect(() => {
        if (
            state.email.trim() &&
            state.password.trim() &&
            state.passwordconfirm.trim()
        ) {
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
        } else {
            dispatch({
                type: "setIsButtonDisabled",
                payload: true
            });
        }
    }, [state.email, state.password, state.passwordconfirm]);

    async function handleSignup(event) {
        event.preventDefault();
        try {
            setError("");
            setSuccessMessage("");
            //sing up ボタンの無効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: true
            });
            await signup(state.email, state.passwordconfirm);
            dispatch({
                type: "signupSuccess",
                payload: "Signup Successfully"
            });
            //sing up ボタンの有効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
            setSuccessMessage("アカウントの作成に成功しました");
            setTimeout(function () {
                console.log("リダレクト処理");
                history.push("/dashboard");
            }, 2000);
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
                    setError("メールアドレスが正しくありません");
                    break;
                case "auth/email-already-in-use":
                    setError(
                        "メールアドレスがすでに使用されています。ログインするか別のメールアドレスで作成してください"
                    );
                    break;
                case "auth/user-disabled":
                    setError("入力されたメールアドレスは無効（BAN）になっています。");
                    break;
                default:
                    //想定外
                    setError(
                        "アカウントの作成に失敗しました。通信環境がいい所で再度やり直してください。"
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
            state.isButtonDisabled || handleSignup();
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

    const handlePasswordConfirmChange: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        dispatch({
            type: "setPasswordConfirm",
            payload: event.target.value
        });
    };

    return (
        <form className={classes.container} noValidate autoComplete="off">
            <Card className={classes.card}>
                <CardHeader className={classes.header} title="Sign UP " />
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
                        <TextField
                            error={state.isError}
                            fullWidth
                            id="password-confirm"
                            type="password"
                            label="Password-confirm"
                            placeholder="Password-confirm"
                            margin="normal"
                            helperText={state.helperText}
                            onChange={handlePasswordConfirmChange}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    もしアカウントがあるなら<Link to="/login">こちら</Link>
                    からログインしてください
                </CardContent>
                <CardActions>
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        className={classes.signupBtn}
                        onClick={handleSignup}
                        disabled={state.isButtonDisabled}
                    >
                        Signup
                    </Button>
                </CardActions>
            </Card>
        </form>
    );
};

export default Signup;