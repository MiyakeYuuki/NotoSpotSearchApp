import React, { useReducer, useEffect, useState } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import CardHeader from "@material-ui/core/CardHeader";
import Button from "@material-ui/core/Button";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            flexWrap: "wrap",
            width: 400,
            margin: `${theme.spacing(0)} auto`
        },
        forgotpasswordBtn: {
            marginTop: theme.spacing(2),
            flexGrow: 1
        },
        header: {
            textAlign: "center",
            background: "#212121",
            color: "#fff"
        },
        card: {
            marginTop: theme.spacing(10)
        }
    })
);

//state type
type State = {
    email: string,
    isButtonDisabled: boolean,
    helperText: string,
    isError: boolean
};

const initialState: State = {
    email: "",
    isButtonDisabled: true,
    helperText: "",
    isError: false
};

type Action =
    | { type: "setEmail", payload: string }
    | { type: "setIsButtonDisabled", payload: boolean }
    | { type: "forgotpasswordSuccess", payload: string }
    | { type: "forgotpasswordFailed", payload: string }
    | { type: "setIsError", payload: boolean };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "setEmail":
            return {
                ...state,
                email: action.payload
            };
        case "setIsButtonDisabled":
            return {
                ...state,
                isButtonDisabled: action.payload
            };
        case "forgotpasswordSuccess":
            return {
                ...state,
                helperText: action.payload,
                isError: false
            };
        case "forgotpasswordFailed":
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

const ForgotPassword = () => {
    const classes = useStyles();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { resetPassword } = useAuth();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (state.email.trim()) {
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
    }, [state.email]);

    async function handleForgotPassword(event) {
        event.preventDefault();
        try {
            setError("");
            setSuccessMessage("");
            //sing up ボタンの無効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: true
            });
            await resetPassword(state.email);
            dispatch({
                type: "forgotpasswordSuccess",
                payload: "ForgotPassword Successfully"
            });
            //ForgotPassword ボタンの有効化
            dispatch({
                type: "setIsButtonDisabled",
                payload: false
            });
            setSuccessMessage("パスワードを初期化しました。");

        } catch (e) {
            console.log(e);
            //エラーのメッセージの表示
            switch (e.code) {
                case "auth/network-request-failed":
                    setError(
                        "通信がエラーになったのか、またはタイムアウトになりました。通信環境がいい所で再度やり直してください。"
                    );
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
                        "処理に失敗しました。通信環境がいい所で再度やり直してください。"
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
            state.isButtonDisabled || handleForgotPassword();
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

    return (
        <form className={classes.container} noValidate autoComplete="off">
            <Card className={classes.card}>
                <CardHeader className={classes.header} title="ForgotPassword" />
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
                    </div>
                    もしアカウントがないなら<Link to="/signup">こちら</Link>
                    からアカウントを作成してください。
                </CardContent>
                <CardActions>
                    <Button
                        variant="contained"
                        size="large"
                        color="secondary"
                        className={classes.forgotpasswordBtn}
                        onClick={handleForgotPassword}
                        disabled={state.isButtonDisabled}
                    >
                        ForgotPassword
                    </Button>
                </CardActions>
            </Card>
        </form>
    );
};

export default ForgotPassword;