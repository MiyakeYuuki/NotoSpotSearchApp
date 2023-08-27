## NotoTourismAppのURL
https://sample-firebase-ed3e4.web.app/

## 参考記事
https://zenn.dev/masalib/books/2d6e8470732c8b/viewer/3d39ec

## ToDo
- 観光地データのフィールド見直し
    - geopointの追加
    - 詳細説明(text)の追加
    - サムネイル画像の追加
    - キーワード(配列)追加
- 観光地検索結果をクリック -> 詳細画面に遷移
- 観光地登録アプリの開発

## 補足
1. `SDK の設定と構成`にdatabaseurlがない
- FirebaseのRealtime Databaseを追加する
2. APIキーを保管場所
- reactプロジェクト直下>.envというファイル
3. @material-ui/coreが使用できない
- reactの最新ver(18.0)では@material-ui/coreが廃止された
- reactのバージョンを下げて対応
- 参考：https://qiita.com/shiho97797/items/cacb21d09330de56a505
- npm install @material-ui/core
- 型推論や注釈はvscode上でエラーが出るが，npm startで問題なく動作する

4. "export 'default' (imported as 'firebase') was not found in 'firebase/app'
- どうやら現在npmでインストールされる最新版のfirebaseパッケージがv10になったことで、インポート方法が少し変わった。
- firebase.jsを以下のように変更
    - import firebase from "firebase/app"
    - import "firebase/auth"
    - →import firebase from 'firebase/compat/app'
    - →import "firebase/compat/auth"

5. 参考記事の05は飛ばす
- 入力処理については余裕があったら行う
- 06でLogin.jsをコピーするとLoginをクリックしたときに以下のようなエラーが発生するので注意
    -  Uncaught runtime errors:，path.split is not a function TypeError: path.split is not a function
    - 05を適応していないSignup.jsをログインバージョンにかきかえると解消される
- 05を飛ばす場合はreact-hook-formは不必要

6. export 'Switch' (imported as 'Switch') was not found in 'react-router-dom'
- react-router-domのバージョンが原因。v6以降はSwitchがRoutesになり書き方に変更点が数カ所。
- ①v5に戻す、②v6の書き方へ変更するの２種類の対処法をまとめました。
- ①の方法は以下
    - npm uninstall react-router-dom
    - npm install react-router-dom@5.2.0
- 参考資料：https://qiita.com/Mai_HB/items/91c6660179b904684d75

## 現存するエラー
1. ログイン時にメアドとパスを入力→Enterを押すと"Uncaught runtime errors"が出てしまう

