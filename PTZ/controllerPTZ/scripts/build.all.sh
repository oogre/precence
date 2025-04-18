# @Author: Evrard Vincent
# @Date:   2023-02-15 14:03:27
# @Last Modified by:   ogre
# @Last Modified time: 2024-03-11 20:48:23


npx babel --verbose --out-dir ./release/ ./src/
rm ./release/ptz
ln -s ./main.js ./release/ptz
chmod +x ./release/main.js
# npm run launch &