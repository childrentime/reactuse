# 解决hooks的 link问题
cd node_modules/react
yarn link
cd ../react-dom
yarn link

cd ../../../core
yarn link
yarn install
yarn link react
yarn link react-dom

cd ./website
yarn link @reactuses/core