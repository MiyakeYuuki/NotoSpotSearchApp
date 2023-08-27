import React, { useState, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import {
    TextField,
    Card,
    Grid,
    CardActions,
    CardHeader,
    Button,
    IconButton,
    Typography,
    Collapse,
    CardContent
} from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useAuth } from "../contexts/AuthContext";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    orderBy,
    startAt,
    endAt,
} from "firebase/firestore";
import fireStoreDB from "../firestore";
// import "../style/StyleDashboard.css";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            width: "100%", // 幅を100%に設定
            margin: `${theme.spacing(0)} auto`,
            flexDirection: "column", // レスポンシブに対応するためにカラム方向に変更
        },
        Btn: {
            marginTop: theme.spacing(1),
            flexGrow: 1,
            width: "100%", // ボタンの幅を100%に設定
        },
        header: {
            textAlign: "center",
            background: "#212121",
            color: "#fff",
            padding: theme.spacing(2), // 余白を追加
        },
        card: {
            width: "100%", // カードの幅を100%に設定
            marginTop: theme.spacing(5),
            maxWidth: 400, // 最大幅を設定
            margin: "0 auto", // 中央寄せ
            padding: theme.spacing(2), // 余白を追加
        }
    })
);

const Dashboard = () => {
    // デザイン変数
    const classes = useStyles();
    const [searchExpanded, setSearchExpanded] = useState(true);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const [buttonName, setButtonName] = useState("エリア＆カテゴリ検索");
    const [spotsExist, setSpotsExist] = useState(true);

    // ログイン機能に使用する変数
    const { currentUser, logout, sendEmailVerification } = useAuth();
    const history = useHistory();
    const [error, setError] = useState("");

    // 観光地検索に使用する変数
    const [spots, setSpots] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [areaOptions, setAreaOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        // area_list検索→チェックボックスにデータを渡す
        const fetchAreas = async () => {
            const areaListCollection = collection(fireStoreDB, "area_list");
            const areaListSnapshot = await getDocs(areaListCollection);
            const areas = areaListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setAreaOptions(areas);
        };

        // category_list検索→チェックボックスにデータを渡す
        const fetchCategories = async () => {
            const categoryListCollection = collection(fireStoreDB, "category_list");
            const categoryListSnapshot = await getDocs(categoryListCollection);
            const categories = categoryListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setCategoryOptions(categories);
        };
        // エリアチェックボックスが選択され，カテゴリチェックボックスが選択されていない場合
        if (selectedAreas.length > 0 && selectedCategories.length === 0) {
            setButtonName("エリア検索");
            setIsButtonEnabled(true);
        }
        // カテゴリチェックボックスが選択され，エリアチェックボックスが選択されていない場合
        else if (selectedCategories.length > 0 && selectedAreas.length === 0) {
            setButtonName("カテゴリー検索");
            setIsButtonEnabled(true);
        }
        // エリア，カテゴリチェックボックスの両方が選択されている場合
        else if (selectedAreas.length > 0 && selectedCategories.length > 0) {
            setButtonName("エリア＆カテゴリ検索");
            setIsButtonEnabled(true);
        }
        // エリア，カテゴリチェックボックスの両方が選択されていない場合
        else {
            setButtonName("エリア＆カテゴリ検索");
            setIsButtonEnabled(false);
        }

        fetchAreas();
        fetchCategories();
    }, [selectedAreas, selectedCategories]);

    // 前方一致検索関数
    const handleNameSearch = () => {
        setSearching(true);

        const fetchData = async () => {
            const fireStorePostData = collection(fireStoreDB, "spots");
            let firestoreQuery = query(fireStorePostData);

            if (searchQuery) {
                firestoreQuery = query(
                    fireStorePostData,
                    orderBy("name"),
                    startAt(searchQuery),
                    endAt(searchQuery + "\uf8ff")
                );
            } else {
                firestoreQuery = query(
                    fireStorePostData,
                    where("name", "==", null)
                );
            }

            const snapShot = await getDocs(firestoreQuery);

            const arrList = await Promise.all(
                snapShot.docs.map(async (docs) => {
                    const docData = docs.data();
                    const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                    const areaSnap = await getDoc(areaRef);
                    const areaData = areaSnap.data();
                    const categoryNames = [];
                    let category;
                    try {
                        for (const categoryRef of docData.category) {
                            const categorySnap = await getDoc(categoryRef);
                            const categoryData = categorySnap.data();
                            categoryNames.push(categoryData.name);
                        }
                        category = categoryNames.join(",");
                    } catch (error) {
                        console.error("カテゴリフィールドの中身がありません", error);
                        category = "";
                    }
                    return {
                        id: docs.id,
                        name: docData.name,
                        area: areaData.name,
                        url: docData.url,
                        category: category,
                    };
                })
            );

            if (arrList.length === 0) {
                setSpotsExist(false); // スポットデータがない場合、スポットが存在しないことを示す
            } else {
                setSpotsExist(true); // スポットデータがある場合、スポットが存在することを示す
            }

            setSpots(arrList);
            setSearching(false);
        };

        const queryValue = searchQuery !== "" ? searchQuery : null;
        setSearchQuery(queryValue);

        fetchData();
    };

    // 絞り込み検索関数
    const handleCombinedSearch = async () => {
        setSearching(true);

        const fetchData = async () => {
            const fireStorePostData = collection(fireStoreDB, "spots");

            let areaQuery = null;
            let categoryQuery = null;

            // areaが選択されている場合、areaのクエリを設定
            if (selectedAreas.length > 0) {
                areaQuery = query(
                    fireStorePostData,
                    where("area", "in", selectedAreas.map((areaId) => doc(fireStoreDB, "area_list", areaId)))
                );
            }

            // categoryが選択されている場合、categoryのクエリを設定
            if (selectedCategories.length > 0) {
                categoryQuery = query(
                    fireStorePostData,
                    where("category", "array-contains-any", selectedCategories.map((selectedCategory) => doc(fireStoreDB, "category_list", selectedCategory)))
                );
            }

            try {
                let combinedResults = [];

                // areaQueryとcategoryQueryを組み合わせて結果を取得
                if (areaQuery && categoryQuery) {
                    const [areaSnapShot, categorySnapShot] = await Promise.all([
                        getDocs(areaQuery),
                        getDocs(categoryQuery)
                    ]);

                    const areaSpotIds = new Set(areaSnapShot.docs.map(doc => doc.id));

                    combinedResults = categorySnapShot.docs
                        .filter((doc) => areaSpotIds.has(doc.id))
                        .map((docs) => {
                            const docData = docs.data();
                            const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                            const categoryRef = docData.category;
                            return {
                                id: docs.id,
                                name: docData.name,
                                areaRef,
                                url: docData.url,
                                categoryRef,
                            };
                        });
                } else if (areaQuery) { // areaのみの検索
                    const areaSnapShot = await getDocs(areaQuery);

                    combinedResults = areaSnapShot.docs.map((docs) => {
                        const docData = docs.data();
                        const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                        const categoryRef = docData.category;
                        return {
                            id: docs.id,
                            name: docData.name,
                            areaRef,
                            url: docData.url,
                            categoryRef,
                        };
                    });
                } else if (categoryQuery) { // categoryのみの検索
                    const categorySnapShot = await getDocs(categoryQuery);

                    combinedResults = categorySnapShot.docs.map((docs) => {
                        const docData = docs.data();
                        const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                        const categoryRef = docData.category;
                        return {
                            id: docs.id,
                            name: docData.name,
                            areaRef,
                            url: docData.url,
                            categoryRef,
                        };
                    });
                }

                await Promise.all(
                    combinedResults.map(async (result) => {
                        const areaSnap = await getDoc(result.areaRef);
                        const areaData = areaSnap.data();
                        const categoryNames = [];

                        try {
                            for (const categoryRef of result.categoryRef) {
                                const categorySnap = await getDoc(categoryRef);
                                const categoryData = categorySnap.data();
                                categoryNames.push(categoryData.name);
                            }
                            result.category = categoryNames.join(",");
                        } catch (error) {
                            console.error("カテゴリフィールドの中身がありません", error);
                            result.category = "";
                        }
                        result.area = areaData.name;
                    })
                );
                if (combinedResults.length === 0) {
                    setSpotsExist(false); // スポットデータがない場合、スポットが存在しないことを示す
                } else {
                    setSpotsExist(true); // スポットデータがある場合、スポットが存在することを示す
                }

                setSpots(combinedResults);
                setSearching(false);

                setSpots(combinedResults);
                setSearching(false);
            } catch (error) {
                console.error("データの取得中にエラーが発生しました", error);
                setSearching(false);
            }
        };

        await fetchData();
    };

    // ログアウト関数
    async function handleLogout() {
        setError("");
        try {
            await logout();
            history.push("/");
        } catch {
            setError("Failed to log out");
        }
    }

    // メールアドレス認証関数
    async function handlesendEmailVerification() {
        setError("");
        try {
            await sendEmailVerification();
            setError("メールを送信しました。メールアドレスを確認してください。");
        } catch (e) {
            console.log(e);
            setError("メールの送信に失敗しました。");
        }
    }
    //エリア表示のボタンスタイル
    const areaButtonStyle = {
        backgroundColor: "#aac4f2",
        color: 'black',
        cursor: 'pointer',
        padding: '0px 10px',
        fontSize: '14px',
        width: 'auto', // 幅を自動調整
        display: 'inline-block',
    };

    // カテゴリ表示のボタンスタイル
    const categoryButtonStyle = {
        backgroundColor: "#f2b3aa",
        color: 'black',
        cursor: 'pointer',
        padding: '0px 10px',
        fontSize: '14px',
        width: 'auto', // 幅を自動調整
        display: 'inline-block',
    };

    return (
        <form className={classes.container} noValidate autoComplete="on">
            <Grid container direction="column" alignItems="center">
                {/* ダッシュボード */}
                <Card className={classes.card}>
                    <CardHeader className={classes.header} title="ダッシュボード" />
                    {error && <div className="error-message" style={{ color: 'red' }}>{error}<br /><br /></div>}
                    <strong>Email:</strong> {currentUser.email}<br />
                    <strong>ハンドル名:</strong> {currentUser.displayName}
                    <CardActions>
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            className={classes.Btn}
                            component={Link}
                            to="/UpdateProfile"
                            fullWidth
                        >
                            プロフィール変更
                        </Button>
                    </CardActions>
                    <CardActions>
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            className={classes.Btn}
                            onClick={handleLogout}
                            fullWidth
                        >
                            ログアウト
                        </Button>
                    </CardActions>
                    {!currentUser.emailVerified && (
                        <div>
                            <br />
                            メールアドレスが確認されていません。<br />
                            以下のボタンから登録処理を行ってください。
                            <CardActions>
                                <Button
                                    variant="contained"
                                    size="large"
                                    color="secondary"
                                    className={classes.Btn}
                                    onClick={handlesendEmailVerification}
                                    fullWidth
                                >
                                    認証メールを送信
                                </Button>
                            </CardActions>
                        </div>
                    )}
                </Card>

                {/* 前方一致検索 */}
                <Card className={classes.card}>
                    <CardHeader className={classes.header} title="観光地検索" />
                    <Typography variant="h6" className={classes.filterHeading}>
                        <strong>前方一致検索</strong>
                        <IconButton
                            className={classes.expandButton}
                            onClick={() => setSearchExpanded(!searchExpanded)}
                            aria-expanded={searchExpanded}
                            aria-label="show more"
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Typography>
                    <Collapse in={searchExpanded} timeout="auto" unmountOnExit>
                        <TextField
                            fullWidth
                            type="text"
                            label="検索キーワードを入力"
                            placeholder="例：のと"
                            margin="normal"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            className={classes.Btn}
                            onClick={handleNameSearch}
                            disabled={!searchQuery || searching}
                        >
                            名前検索
                        </Button>
                    </Collapse>

                    {/* 絞り込み検索 */}
                    <Typography variant="h6" className={classes.filterHeading}>
                        <strong>絞り込み検索</strong>
                        <IconButton
                            className={classes.expandButton}
                            onClick={() => setFilterExpanded(!filterExpanded)}
                            aria-expanded={filterExpanded}
                            aria-label="show more"
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Typography>
                    <Collapse in={filterExpanded} timeout="auto" unmountOnExit>
                        <h4>エリア</h4>
                        {areaOptions.map((area) => (
                            <label key={area.id}>
                                <input
                                    type="checkbox"
                                    value={area.id}
                                    checked={selectedAreas.includes(area.id)}
                                    onChange={(e) => {
                                        const areaId = e.target.value;
                                        if (selectedAreas.includes(areaId)) {
                                            setSelectedAreas(selectedAreas.filter((id) => id !== areaId));
                                        } else {
                                            setSelectedAreas([...selectedAreas, areaId]);
                                        }
                                    }}
                                />
                                {area.name}
                            </label>
                        ))}
                        <h4>カテゴリー</h4>
                        {categoryOptions.map((category) => (
                            <label key={category.id}>
                                <input
                                    type="checkbox"
                                    value={category.id}
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={(e) => {
                                        const categoryId = e.target.value;
                                        if (selectedCategories.includes(categoryId)) {
                                            setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
                                        } else {
                                            setSelectedCategories([...selectedCategories, categoryId]);
                                        }
                                    }}
                                />
                                {category.name}
                            </label>
                        ))}
                        <CardActions>
                            <Button
                                variant="contained"
                                size="large"
                                color="primary"
                                className={classes.Btn}
                                onClick={handleCombinedSearch}
                                disabled={!isButtonEnabled} // ボタンの有効/無効を設定
                            >
                                {buttonName}
                            </Button>
                        </CardActions>
                    </Collapse>

                    <h2>検索結果</h2>
                    {!spotsExist ? (
                        <p>該当するスポットはありません。</p>
                    ) : (
                        spots.map((spot) => (
                            <Card key={spot.id} className={classes.spotCard}>
                                <CardContent>
                                    <Typography variant="h6" className={classes.spotName}>
                                        <strong>名前：{spot.name}</strong>
                                    </Typography>
                                    <div className={classes.areaContainer}>
                                        エリア：
                                        <Button
                                            variant="contained"
                                            style={areaButtonStyle}
                                        //onClick={handleButtonClick}
                                        >
                                            {spot.area}
                                        </Button>
                                    </div>
                                    {/* <div className={classes.categoryContainer}> */}
                                    <Typography variant="body1" className={classes.categoryText}>
                                        カテゴリ：
                                        {spot.category
                                            .split(',')
                                            .map((category, index) => category.trim())
                                            .filter(category => category !== "") // 空のカテゴリをフィルタリング
                                            .map((category, index) => (
                                                <Button
                                                    variant="contained"
                                                    style={categoryButtonStyle}
                                                    key={index} className={classes.categoryButton}>
                                                    {category.trim()}
                                                </Button>
                                            ))}
                                    </Typography>
                                    {/* </div> */}
                                    <Typography variant="body1" className={classes.urlText}>
                                        HP：
                                        <a href={spot.url} target="_blank" rel="noopener noreferrer">
                                            {spot.url}
                                        </a>

                                    </Typography>
                                </CardContent>
                            </Card>
                        ))
                    )}

                </Card>
            </Grid>
        </form >
    );
};

export default Dashboard;