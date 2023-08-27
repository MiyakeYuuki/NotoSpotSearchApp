import React from 'react'
import { Link } from "react-router-dom"
import {
    Card, Grid, CardActions, CardHeader, Button
} from "@material-ui/core";
import useStyles from './../style/Styles';

const Home = () => {
    const classes = useStyles();
    return (
        <form className={classes.container} noValidate autoComplete="on">
            <Card className={classes.card}>
                <CardHeader className={classes.header} title="Welcome to 能登観光アプリ" />
                <CardActions>
                    <Grid container direction="column" alignItems="center">
                        <br />
                        すでにアカウントをお持ちの方はこちら
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            className={classes.Btn}
                            component={Link}
                            to="/login"
                            fullWidth
                        >
                            Login
                        </Button>
                        <br /><br />
                        アカウントを新規作成する方はこちら
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            className={classes.Btn}
                            component={Link}
                            to="/signup"
                            fullWidth
                        >
                            Signup
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </form >
    )
}

export default Home