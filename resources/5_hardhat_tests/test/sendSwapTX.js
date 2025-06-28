const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const {
  addressFactory,
  addressRouter,
  addressFrom,
  addressTo,
} = require("../utils/AddressList");

const { erc20ABI, factoryABI, routerABI } = require("../utils/AbiList");

describe("Read and Write to the Blockchain", () => {
  let provider,
    contractFactory,
    contractRouter,
    contractToken,
    decimals,
    amountIn;

  // connecting to provider
  provider = new ethers.providers.JsonRpcProvider(
    "https://eth-mainnet.g.alchemy.com/v2/_cOAd2OKemI3n-DhLIblOboDNbjJZ0zl"
  );

  // contract addresses
  contractFactory = new ethers.Contract(addressFactory, factoryABI, provider); // if third argument is provider, the contract can only read data
  contractRouter = new ethers.Contract(addressRouter, routerABI, provider);
  contractToken = new ethers.Contract(addressFrom, erc20ABI, provider);
  sushiToken = new ethers.Contract(addressTo, erc20ABI, provider);

  const whaleAddress = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8";
  
  const amountInHuman = "1";
  amountIn = ethers.utils.parseUnits(amountInHuman, decimals).toString();

  // get price information
  const getAmountOut = async () => {
    decimals = await contractToken.decimals();

    const amountsOut = await contractRouter.getAmountsOut(amountIn, [
      addressFrom,
      addressTo,
    ]);

    return amountsOut[1].toString();
  };

  const logBalances = async (signer) => {
    console.log("Balance in ETH", ethers.utils.formatEther(await ethers.provider.getBalance(signer.address), "ETH"));
    console.log("Balance in WETH", ethers.utils.formatEther(await contractToken.balanceOf(signer.address), "ETH"));
    console.log("Balance in SUSHI", await sushiToken.balanceOf(signer.address));
  };

  it("connects to a provider, factory, token and router", () => {
    assert(provider._isProvider);

    expect(contractFactory.address).to.equal(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    );

    expect(contractRouter.address).to.equal(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    expect(contractToken.address).to.equal(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  });

  it("gets the price of amountsOut", async () => {
    const amount = await getAmountOut();
    assert(amount);
  });

  it("impersonates a whale", async () => {
    const impersonatedSigner = await ethers.getImpersonatedSigner(whaleAddress);
    assert(impersonatedSigner);
  });

  it("sends a transactions, i.e. swaps a token", async () => {
    const [ownerSigner] = await ethers.getSigners();

    await logBalances(ownerSigner);

    const mainnetForkUniswapRouter = new ethers.Contract(
      addressRouter,
      routerABI,
      ownerSigner // if third argument is signer, the contract can send transactions and sign them with private key
    );

    const myAddress = ownerSigner.address;

    const amountOut = await getAmountOut();

    const txSwap = await mainnetForkUniswapRouter.swapExactTokensForTokens(
      amountIn, // the amount of input token that I want to exchange, where the input token is the first element in the path array (addressFrom)
      amountOut, // an array with the expected output amounts for each token in the path, where the first element is the input amount (amountIn)
      [addressFrom, addressTo], // path,
      myAddress, // address to,
      Date.now() + 1000 * 60 * 5, // 5 minutes from now
      {
        gasLimit: 200000, // the maximum amount of gas units you are willing to pay
        gasPrice: ethers.utils.parseUnits("5.5", "gwei"), // the amount you are willing to pay per unit of gas
      } // gas
    );

    assert(txSwap.hash);

    const mainnetForkProvider = waffle.provider;
    const txReceipt = await mainnetForkProvider.getTransactionReceipt(
      txSwap.hash
    );

    /*console.log("SWAP TRANSACTION");
    console.log(txSwap);

    console.log("TRANSACTION RECEIPT");
    console.log(txReceipt);*/

    await logBalances(ownerSigner);
  });
});
