# Commands
* Run in working directory `resources/3_hardhat_tutorial`
* `npm init`
* `npm install --save-dev hardhat`
* `npx hardhat init`
  * Choose `Create an empty hardhat.config.js`
* `npm install --save-dev @nomicfoundation/hardhat-toolbox`
  * Has everything you need for developing smart contracts
* `npx hardhat`
  * Shows all the tasks available in this project
* `npx hardhat compile`
  * Compiles the Solidity smart contracts
* `npx hardhat test`
* `npx hardhat ignition deploy ./ignition/modules/Token.js --network sepolia`
  * Where `sepolia` is a network defined in `hardhat.config.js`