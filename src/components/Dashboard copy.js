/**
 * ログイン認証後にアクセスできるダッシュボード
 */

// ログイン時に使用するコンポーネント
import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import { useAuth } from "../contexts/AuthContext";

// 観光地検索時に使用するコンポーネント
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    orderBy,
    startAt,
    endAt
} from "firebase/firestore";
import fireStoreDB from "../firestore";
import "./styles.css";


const Dashboard = () => {
    // ログイン時に使用する変数
    const { currentUser, logout, sendEmailVerification } = useAuth();
    const history = useHistory();
    const [error, setError] = useState("");

    // 観光地検索時に使用する変数
    const [spots, setSpots] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAreas, setSelectedAreas] = useState([]); // 選択されたエリアの配列
    const [selectedCategories, setSelectedCategories] = useState([]); // 選択されたカテゴリの配列
    const [areaOptions, setAreaOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]); // カテゴリの選択肢
    const [searching, setSearching] = useState(false);

    // 観光地検索用データ読み込み
    useEffect(() => {
        const fetchAreas = async () => {
            const areaListCollection = collection(fireStoreDB, "area_list");
            const areaListSnapshot = await getDocs(areaListCollection);
            const areas = areaListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name
            }));
            setAreaOptions(areas);
        };

        const fetchCategories = async () => {
            const categoryListCollection = collection(fireStoreDB, "category_list");
            const categoryListSnapshot = await getDocs(categoryListCollection);
            const categories = categoryListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name
            }));
            setCategoryOptions(categories);
        };

        fetchAreas();
        fetchCategories();
    }, []);

    // 前方一致検索
    const handleNameSearch = () => {
        setSearching(true);

        const fetchData = async () => {
            const fireStorePostData = collection(fireStoreDB, "spots");
            let firestoreQuery = query(fireStorePostData);

            if (searchQuery) {
                firestoreQuery = query(
                    fireStorePostData,
                    orderBy('name'),
                    startAt(searchQuery),
                    endAt(searchQuery + '\uf8ff')
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
                    // カテゴリデータを格納する配列
                    const categoryNames = [];
                    let category;
                    try {
                        // カテゴリ参照の各参照に対してループ
                        for (const categoryRef of docData.category) {
                            // カテゴリ参照からカテゴリデータを取得
                            const categorySnap = await getDoc(categoryRef);
                            const categoryData = categorySnap.data();
                            // カテゴリデータからのカテゴリ名を配列に追加
                            categoryNames.push(categoryData.name);
                        }
                        // カテゴリ名の配列を結合してカテゴリフィールドに設定
                        category = categoryNames.join(', '); // すべてのカテゴリ名をカンマで区切って文字列にする

                    } catch (error) {
                        console.error("カテゴリフィールドの中身がありません", error);
                        category = "";
                    }
                    return { id: docs.id, name: docData.name, area: areaData.name, url: docData.url, category: category };
                })
            );

            setSpots(arrList);
            setSearching(false);
        };

        const queryValue = searchQuery !== "" ? searchQuery : null;
        setSearchQuery(queryValue);

        fetchData();
    };


    // エリア、カテゴリ絞り込み検索
    const handleCombinedSearch = async () => {
        setSearching(true);

        const fetchData = async () => {
            const fireStorePostData = collection(fireStoreDB, "spots");

            let areaQueries = selectedAreas.map(areaId =>
                query(fireStorePostData, where("area", "==", doc(fireStoreDB, "area_list", areaId)))
            );

            try {
                const [areaSnapShots, ...categorySnapShotsArray] = await Promise.all([
                    Promise.all(areaQueries.map(q => getDocs(q))),
                    ...selectedCategories.map(selectedCategory => {
                        const categoryQuery = query(fireStorePostData, where("category", "array-contains", doc(fireStoreDB, "category_list", selectedCategory)));
                        return getDocs(categoryQuery);
                    })
                ]);

                // エリアとカテゴリの両方に一致するスポットを抽出
                const areaSpotIds = new Set();
                areaSnapShots.forEach(snapShot => {
                    snapShot.docs.forEach(doc => {
                        areaSpotIds.add(doc.id);
                    });
                });

                // 一時的にデータを格納するためのオブジェクト
                let temporaryDataId = [];
                let combinedResults = [];
                // カテゴリが選択されている場合のみ結果を絞り込む
                if (selectedCategories.length > 0) {
                    categorySnapShotsArray.forEach(categorySnapShots => {
                        combinedResults = combinedResults.concat(
                            categorySnapShots.docs
                                .filter(doc => areaSpotIds.has(doc.id))
                                .map(docs => {
                                    const docData = docs.data();
                                    const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                                    const categoryRef = docData.category;
                                    //console.log(temporaryDataId);
                                    // 異なるIDのspotデータのみデータを返す
                                    if (!temporaryDataId.includes(docs.id)) {
                                        temporaryDataId.push(docs.id);
                                        return { id: docs.id, name: docData.name, areaRef, url: docData.url, categoryRef };
                                    }
                                    // IDが重複する場合は null を返す
                                    else {
                                        return null;
                                    }
                                })
                        );
                    });
                }
                // カテゴリが選択されていない場合、エリアの絞り込みのみ適用
                else {
                    areaSnapShots.forEach(snapShot => {
                        combinedResults = combinedResults.concat(
                            snapShot.docs.map(docs => {
                                const docData = docs.data();
                                const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                                const categoryRef = docData.category;
                                return { id: docs.id, name: docData.name, areaRef, url: docData.url, categoryRef };
                            })
                        );
                    });
                }

                // null を除外して新しい配列を生成
                combinedResults = combinedResults.filter(result => result !== null);

                // エリアデータとカテゴリデータの取得と結果の設定
                await Promise.all(combinedResults.map(async result => {
                    // エリア参照からエリアデータを取得
                    const areaSnap = await getDoc(result.areaRef);
                    const areaData = areaSnap.data();

                    // カテゴリデータを格納する配列
                    const categoryNames = [];

                    try {
                        // カテゴリ参照の各参照に対してループ
                        for (const categoryRef of result.categoryRef) {
                            // カテゴリ参照からカテゴリデータを取得
                            const categorySnap = await getDoc(categoryRef);
                            const categoryData = categorySnap.data();
                            // カテゴリデータからのカテゴリ名を配列に追加
                            categoryNames.push(categoryData.name);
                        }
                        // カテゴリ名の配列を結合してカテゴリフィールドに設定
                        result.category = categoryNames.join(', '); // すべてのカテゴリ名をカンマで区切って文字列にする

                    } catch (error) {
                        console.error("カテゴリフィールドの中身がありません", error);
                        result.category = "";
                    }
                    // エリアデータからのエリア名
                    result.area = areaData.name;
                }));

                setSpots(combinedResults);
                setSearching(false);
            } catch (error) {
                // エラーハンドリング
                console.error("データの取得中にエラーが発生しました", error);
                setSearching(false);
            }
        };

        await fetchData(); // 非同期操作が完了するまで待つ
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
            setError("メールをおくりました。メール有効化をお願いします");
        } catch (e) {
            console.log(e);
            setError("有効化メールの送信に失敗しました");
        }
    }


    return (

        <div className="app-container">
            {/* ユーザー情報 */}
            Dashboard：
            {error && <div style={{ color: "red" }}>{error}</div>}
            <div>
                <strong>Email:</strong> {currentUser.email}
            </div>
            <div>
                <strong>ハンドル名:</strong> {currentUser.displayName}
            </div>
            <h2>
                <Button color="primary">
                    <Link to="/login">Login</Link>
                </Button>
            </h2>
            <h2>
                <Button color="primary">
                    <Link to="/signup">signup</Link>
                </Button>
            </h2>
            <h2>
                <Button color="primary">
                    <Link to="/updateprofile">プロフィール変更</Link>
                </Button>
            </h2>
            <Button color="primary" onClick={handleLogout}>
                Logout
            </Button>
            {!currentUser.emailVerified && (
                <div>
                    メールアドレスが有効化されていません{" "}
                    <Button color="primary" onClick={handlesendEmailVerification}>
                        メールアドレス有効化
                    </Button>
                </div>
            )}

            {/* 観光地検索 */}
            <h1>スポット検索</h1>

            <div className="search-section">
                <h2>前方一致検索</h2>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="検索する文字列を入力"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleNameSearch} disabled={searching}>
                        名前検索
                    </button>
                </div>
            </div>

            <div className="filter-section">
                <h2>絞り込み検索</h2>

                <div className="filter-subsection">
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
                </div>

                <div className="filter-subsection">
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
                </div>
            </div>

            <button onClick={handleCombinedSearch} disabled={searching}>
                エリア＆カテゴリ検索
            </button>

            <ul className="spot-list">
                {spots.map((spot) => (
                    <li key={spot.id} className="spot-item">
                        <div className="spot-name">名前：{spot.name}</div>
                        <div className="spot-area">エリア：{spot.area}</div>
                        <div className="spot-url">URL：{spot.url}</div>
                        <div className="spot-category">カテゴリ：{spot.category}</div>
                    </li>
                ))}
            </ul>

        </div>
    );
};
export default Dashboard;