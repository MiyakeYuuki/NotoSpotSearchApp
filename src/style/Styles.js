import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            width: "100%",
            margin: `${theme.spacing(0)} auto`,
            flexDirection: "column",
        },
        Btn: {
            marginTop: theme.spacing(1),
            flexGrow: 1,
            width: "100%",
        },
        header: {
            textAlign: "center",
            background: "#212121",
            color: "#fff",
            padding: theme.spacing(2),
        },
        card: {
            width: "100%",
            marginTop: theme.spacing(5),
            maxWidth: 400,
            margin: "0 auto",
            padding: theme.spacing(2),
        },
        cardWithBorder: {
            border: "1px solid #ccc", // 枠線のスタイル
        },
    })
);

export default useStyles;