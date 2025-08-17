const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { impersonateFundErc20 } = require("../utils/utilities");
const { abi } = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");

describe("FlashSwap Contract (on Hardhat BNB Chain Network)", () => {
    const DECIMALS = 18;
    const FUNDING_AMOUNT = "100";
    const BORROW_AMOUNT = "1";

    const FACTORY_PANCAKE = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
    const FACTORY_APESWAP = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6";
    const ROUTER_PANCAKE = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const ROUTER_APESWAP = "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7";

    // Following addresses are found in bscscan.com
    const BUSD_WHALE_ADDRESS = "0x174Ca62427d18b317b4226342db9E309c0fbd841";
    const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const APYS_ADDRESS = "0x37dfACfaeDA801437Ff648A1559d73f4C40aAcb7";

    let provider = null,
        busdContract = null,
        flashSwapContract = null,
        fundAmountBigNumber = null,
        borrowAmountBigNumber = null,
        txArbitrage = null,
        gasUsedUSD;

    beforeEach(async () => {
        // Get owner as signer
        [owner] = await ethers.getSigners();

        // Waffle is a smart contract testing library that uses JavaScript, is a part of Hardhat, and acts as a connection to the Ethereum network, where the statement waffle.provider creates a local in-memory Ethereum node
        provider = waffle.provider;
        busdContract = new ethers.Contract(BUSD_ADDRESS, abi, provider);

        // Assert that whale has balance
        const whaleBalance = await provider.getBalance(BUSD_WHALE_ADDRESS);
        expect(whaleBalance).not.equal("0");

        // Deploy smart contract, which must be defined in the default "contracts" directory. The response object is a factory with methods like deploy() used to deploy the contract.
        const flashSwapContractFactory = await ethers.getContractFactory("ContractFlashTri");
        flashSwapContract = await flashSwapContractFactory.deploy();
        await flashSwapContract.deployed();

        // Fund the FlashSwap contract (for testing purposes only, in real-life scenarios the FlashSwap contract is already funded). This function impersonates the  whale, sends funds to the FlashSwap contract, and stops impersonating the whale.
        fundAmountBigNumber = ethers.utils.parseUnits(FUNDING_AMOUNT, DECIMALS);
        await impersonateFundErc20(
            busdContract,
            BUSD_WHALE_ADDRESS,
            flashSwapContract.address,
            FUNDING_AMOUNT
        );

        // Configure borrowing
        borrowAmountBigNumber = ethers.utils.parseUnits(BORROW_AMOUNT, DECIMALS);
    });

    it("should return whale balances in BNB and BUSD", async () => {
        // Gets the balance of the whale in BNB, which is the network's native token
        const bnbBalanceBigNumber = await provider.getBalance(BUSD_WHALE_ADDRESS);
        expect(bnbBalanceBigNumber).not.equal("0");
        console.log("Whale balance BNB: " + ethers.utils.formatUnits(bnbBalanceBigNumber.toString(), DECIMALS));

        // Gets the balance of the whale in BUSD
        const busdBalanceBigNumber = await busdContract.balanceOf(BUSD_WHALE_ADDRESS);
        console.log("Whale balance BUSD:" + ethers.utils.formatUnits(busdBalanceBigNumber, DECIMALS));
    });

    it("should have funds", async () => {
        const flashSwapContractBalanceBigNumber = await flashSwapContract.getBalanceOfToken(BUSD_ADDRESS);

        const flashSwapBalance = ethers.utils.formatUnits(flashSwapContractBalanceBigNumber, DECIMALS);

        console.log("FlashSwap Contract balance BUSD: " + flashSwapBalance);

        expect(Number(flashSwapBalance)).equal(Number(FUNDING_AMOUNT));
    });

    it("executes the arbitrage", async () => {
        // console.log(ethers.utils.formatUnits("8211184147365292123", 18));

        txArbitrage = await flashSwapContract.triangularArbitrage(
            [FACTORY_PANCAKE, FACTORY_PANCAKE, FACTORY_PANCAKE],
            [ROUTER_PANCAKE, ROUTER_PANCAKE, ROUTER_PANCAKE],
            [BUSD_ADDRESS, WBNB_ADDRESS, APYS_ADDRESS],
            borrowAmountBigNumber
        );

        assert(txArbitrage);

        // Print balances
        const contractBalanceTOKENA = await flashSwapContract.getBalanceOfToken(BUSD_ADDRESS);

        const formattedBalTOKENA = Number(
            ethers.utils.formatUnits(contractBalanceTOKENA, 18)
        );
        const contractBalanceTOKENB = await flashSwapContract.getBalanceOfToken(WBNB_ADDRESS);

        console.log("Balance Of TOKEN A: " + formattedBalTOKENA);

        console.log(
            "Balance Of TOKEN B: " +
            ethers.utils.formatUnits(contractBalanceTOKENB, 18)
        );
    });

    /*describe("Arbitrage execution", () => {
      
  
      it("provides GAS output", async () => {
        const txReceipt = await provider.getTransactionReceipt(txArbitrage.hash);
  
        const effGasPrice = txReceipt.effectiveGasPrice;
        const txGasUsed = txReceipt.gasUsed;
        const gasUsedBNB = effGasPrice * txGasUsed;
        gasUsedUSD = ethers.utils.formatUnits(gasUsedBNB, 18) * 395; // USD to BNB price today
  
        console.log("Total Gas USD: " + gasUsedUSD);
  
        expect(gasUsedUSD).gte(0.1);
      });
    });*/
});
