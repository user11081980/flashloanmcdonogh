const { ethers } = require("ethers");

// All the parsing utilities return wei
// 1 ether = 1 ^ 18 wei = 1 ^ 9 gwei

console.log(ethers.parseEther("0.01")); // 1 with 16 0s
console.log(ethers.parseUnits("0.01", "ether")); // 1 with 16 0s
console.log(ethers.parseUnits("30", "wei")); // 30
console.log(ethers.parseUnits("30", "gwei")); // 30 with 9 0s

const providerTestnet = new ethers.JsonRpcProvider(
  //"https://ethereum-sepolia-rpc.publicnode.com"
  "https://eth-sepolia.g.alchemy.com/v2/_cOAd2OKemI3n-DhLIblOboDNbjJZ0zl"
);

const myAddress = "0x6775031fF19072554d5815c4cFdcEE2E4a500ea8";
const wethAddress = "0xdd13E55209Fd76AfE204dBda4007C227904f0a81";
const privateKey = "45660f260581ddd76bb1f39c9a92f64f638e244c475ee5157b29f46178324183";
const walletSigner = new ethers.Wallet(privateKey, providerTestnet);//.connect(providerTestnet);

const exchangeETH = async () => {
  const txBuild = {
    from: myAddress,
    to: wethAddress,
    value: ethers.parseUnits("0.01", "ether"),
    //nonce: 1,
    //gasPrice: null,
    //gasLimit: 1000000, // Number of gas units
    //maxFeePerGas: ethers.parseUnits("30", "gwei"), // Fee in wei of one gas unit
    //maxPriorityFeePerGas: ethers.parseUnits("30", "gwei") // Fee in wei for tip per unit of gas
  };

  const txSend = await walletSigner.sendTransaction(txBuild);

  console.log("Mining transaction:", txSend.hash);

  const receipt = await txSend.wait();

  console.log("Mined in block:", receipt.blockNumber);
};

exchangeETH();
