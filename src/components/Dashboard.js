import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
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
import "../style/StyleDashboard.css";

const Dashboard = () => {
    const { currentUser, logout, sendEmailVerification } = useAuth();
    const history = useHistory();
    const [error, setError] = useState("");

    const [spots, setSpots] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [areaOptions, setAreaOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [searching, setSearching] = useState(false);

    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
            const areaListCollection = collection(fireStoreDB, "area_list");
            const areaListSnapshot = await getDocs(areaListCollection);
            const areas = areaListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setAreaOptions(areas);
        };

        const fetchCategories = async () => {
            const categoryListCollection = collection(fireStoreDB, "category_list");
            const categoryListSnapshot = await getDocs(categoryListCollection);
            const categories = categoryListSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setCategoryOptions(categories);
        };

        fetchAreas();
        fetchCategories();
    }, []);

    const toggleAccordion = () => {
        setIsAccordionOpen(!isAccordionOpen);
    };

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
                        category = categoryNames.join(", ");
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

            setSpots(arrList);
            setSearching(false);
        };

        const queryValue = searchQuery !== "" ? searchQuery : null;
        setSearchQuery(queryValue);

        fetchData();
    };

    const handleCombinedSearch = async () => {
        setSearching(true);

        const fetchData = async () => {
            const fireStorePostData = collection(fireStoreDB, "spots");

            let areaQueries = selectedAreas.map((areaId) =>
                query(fireStorePostData, where("area", "==", doc(fireStoreDB, "area_list", areaId)))
            );

            try {
                const [areaSnapShots, ...categorySnapShotsArray] = await Promise.all([
                    Promise.all(areaQueries.map((q) => getDocs(q))),
                    ...selectedCategories.map((selectedCategory) => {
                        const categoryQuery = query(
                            fireStorePostData,
                            where("category", "array-contains", doc(fireStoreDB, "category_list", selectedCategory))
                        );
                        return getDocs(categoryQuery);
                    }),
                ]);

                const areaSpotIds = new Set();
                areaSnapShots.forEach((snapShot) => {
                    snapShot.docs.forEach((doc) => {
                        areaSpotIds.add(doc.id);
                    });
                });

                let temporaryDataId = [];
                let combinedResults = [];
                if (selectedCategories.length > 0) {
                    categorySnapShotsArray.forEach((categorySnapShots) => {
                        combinedResults = combinedResults.concat(
                            categorySnapShots.docs
                                .filter((doc) => areaSpotIds.has(doc.id))
                                .map((docs) => {
                                    const docData = docs.data();
                                    const areaRef = doc(fireStoreDB, "area_list", docData.area.id);
                                    const categoryRef = docData.category;
                                    if (!temporaryDataId.includes(docs.id)) {
                                        temporaryDataId.push(docs.id);
                                        return {
                                            id: docs.id,
                                            name: docData.name,
                                            areaRef,
                                            url: docData.url,
                                            categoryRef,
                                        };
                                    } else {
                                        return null;
                                    }
                                })
                        );
                    });
                } else {
                    areaSnapShots.forEach((snapShot) => {
                        combinedResults = combinedResults.concat(
                            snapShot.docs.map((docs) => {
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
                            })
                        );
                    });
                }

                combinedResults = combinedResults.filter((result) => result !== null);

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
                            result.category = categoryNames.join(", ");
                        } catch (error) {
                            console.error("カテゴリフィールドの中身がありません", error);
                            result.category = "";
                        }
                        result.area = areaData.name;
                    })
                );

                setSpots(combinedResults);
                setSearching(false);
            } catch (error) {
                console.error("データの取得中にエラーが発生しました", error);
                setSearching(false);
            }
        };

        await fetchData();
    };

    async function handleLogout() {
        setError("");
        try {
            await logout();
            history.push("/");
        } catch {
            setError("Failed to log out");
        }
    }

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

    return (
        <div className="dashboard-container">
            <div className="dashboard-user-info">
                <h1>Dashboard</h1>
                {error && <div className="error-message">{error}</div>}
                <div className="user-info">
                    <strong>Email:</strong> {currentUser.email}
                </div>
                <div className="user-info">
                    <strong>ハンドル名:</strong> {currentUser.displayName}
                </div>
                <Button color="primary" onClick={handleLogout}>
                    ログアウト
                </Button>
                {!currentUser.emailVerified && (
                    <div className="email-verification">
                        メールアドレスが確認されていません{" "}
                        <Button color="primary" onClick={handlesendEmailVerification}>
                            メールを再送信
                        </Button>
                    </div>
                )}
            </div>

            <div className="spot-search">
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
                    <div className="filter-section-header">
                        <h2 className="filter-section-title">絞り込み検索</h2>
                        {/* アコーディオンの開閉ボタン */}
                        <button className="accordion-button" onClick={toggleAccordion}>
                            {isAccordionOpen ? "-" : "+"}
                        </button>
                    </div>
                    {/* アコーディオンのコンテンツ */}
                    {isAccordionOpen && (
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
                            <div>
                                <button onClick={handleCombinedSearch} disabled={searching}>
                                    エリア＆カテゴリ検索
                                </button>
                            </div>
                        </div>
                    )}

                </div>


                <h2>検索結果</h2>
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
        </div>
    );
};

export default Dashboard;