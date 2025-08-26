//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.6;

import "hardhat/console.sol";

// Uniswap interface and library imports
import "./libraries/UniswapV2Library.sol";
import "./libraries/SafeERC20.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IERC20.sol";

contract PancakeFlashSwap {
    using SafeERC20 for IERC20;

    address private constant PANCAKE_FACTORY_ADDRESS = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
    address private constant PANCAKE_ROUTER_ADDRESS = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    address private constant WBNB_ADDRESS = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address private constant BUSD_ADDRESS = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address private constant CAKE_ADDRESS = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;
    address private constant CROX_ADDRESS = 0x2c094F5A7D1146BB93850f629501eB749f6Ed491;

    uint256 private deadline = block.timestamp + 1 days;
    uint256 private constant MAX_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935; // This value equals 2^256 - 1 and is the largest possible unsigned integer in Ethereum and is commonly used to set infinite allowances

    // Funds the contract by transferring from the owner's address into the contract's address.
    function fundFlashSwapContract(address tokenAddress, address ownerAddress, uint256 amount) public {
        IERC20(tokenAddress).transferFrom(ownerAddress, address(this), amount);
    }

    // Gets the contract's balance.
    function getBalanceOfToken(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // PLACE A TRADE
    // Executed placing a trade
    function placeTrade(
        address _fromToken,
        address _toToken,
        uint256 _amountIn
    ) private returns (uint256) {
        address pair = IUniswapV2Factory(PANCAKE_FACTORY_ADDRESS).getPair(
            _fromToken,
            _toToken
        );
        require(pair != address(0), "Pool does not exist");

        // Calculate Amount Out
        address[] memory path = new address[](2);
        path[0] = _fromToken;
        path[1] = _toToken;

        uint256 amountRequired = IUniswapV2Router01(PANCAKE_ROUTER_ADDRESS)
            .getAmountsOut(_amountIn, path)[1];

        // console.log("amountRequired", amountRequired);

        // Perform Arbitrage - Swap for another token
        uint256 amountReceived = IUniswapV2Router01(PANCAKE_ROUTER_ADDRESS)
            .swapExactTokensForTokens(
                _amountIn, // amountIn
                amountRequired, // amountOutMin
                path, // path
                address(this), // address to
                deadline // deadline
            )[1];

        // console.log("amountRecieved", amountReceived);

        require(amountReceived > 0, "Aborted Tx: Trade returned zero");

        return amountReceived;
    }

    // CHECK PROFITABILITY
    // Checks whether > output > input
    function checkProfitability(
        uint256 _input,
        uint256 _output
    ) private returns (bool) {
        return _output > _input;
    }

    // Starts arbitrage from the given token and amount to borrow.
    function startArbitrage(address borrowTokenAddress, uint256 borrowAmount) external {
        // Allows the PancakeSwap router to trade the tokens on the contract's behalf.
        IERC20(BUSD_ADDRESS).safeApprove(address(PANCAKE_ROUTER_ADDRESS), MAX_INT);
        IERC20(CROX_ADDRESS).safeApprove(address(PANCAKE_ROUTER_ADDRESS), MAX_INT);
        IERC20(CAKE_ADDRESS).safeApprove(address(PANCAKE_ROUTER_ADDRESS), MAX_INT);

        // Gets the pair address from the factory.
        address pairAddress = IUniswapV2Factory(PANCAKE_FACTORY_ADDRESS).getPair(borrowTokenAddress, WBNB_ADDRESS);

        // Asserts that the address is not zero and therefore that the pair exists.
        require(pairAddress != address(0), "Pair does not exist.");

        // Prepares the arguments to call the pair.swap() function, which swaps token0 by token1 in the pair, and where one of the amounts must be zero.
        address token0Address = IUniswapV2Pair(pairAddress).token0();
        address token1Address = IUniswapV2Pair(pairAddress).token1();
        uint256 amount0Out = borrowTokenAddress == token0Address ? borrowAmount : 0;
        uint256 amount1Out = borrowTokenAddress == token1Address ? borrowAmount : 0;

        // Prepares the arguments to call the pair.swap() function, where msg.sender is the address of the contract that called the current function.
        bytes memory data = abi.encode(borrowTokenAddress, borrowAmount, msg.sender);

        // Executes the flash swap. To differentiate between the typical trading case and the flash swap case, pairs use the data parameter. If data.length equals zero, the contract transfers the tokens to the to address. Otherwise, the contract transfers the tokens to the to address and then calls either uniswapV2Call() or pancakeCall().
        IUniswapV2Pair(pairAddress).swap(amount0Out, amount1Out, address(this), data);
    }

    function pancakeCall(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external {
        // Gets the pair address from the factory.
        address token0Address = IUniswapV2Pair(msg.sender).token0();
        address token1Address = IUniswapV2Pair(msg.sender).token1();
        address pairAddress = IUniswapV2Factory(PANCAKE_FACTORY_ADDRESS).getPair(token0Address, token1Address);

        // Asserts that the caller is the pair contract. Asserts that the sender argument is this contract.
        require(msg.sender == pairAddress, "The sender must match the pair.");
        require(sender == address(this), "The sender must match this contract.");

        // Decodes the data argument.
        (address borrowTokenAddress, uint256 borrowAmount, address contractAddress) = abi.decode(data, (address, uint256, address));

        // Calculate the amount to repay at the end
        uint256 fee = ((borrowAmount * 3) / 997) + 1;
        uint256 amountToRepay = borrowAmount + fee;

        // DO ARBITRAGE

        /*// Assign loan amount
        uint256 loanAmount = _amount0 > 0 ? _amount0 : _amount1;

        // Place Trades
        uint256 trade1AcquiredCoin = placeTrade(BUSD, CROX, loanAmount);
        uint256 trade2AcquiredCoin = placeTrade(CROX, CAKE, trade1AcquiredCoin);
        uint256 trade3AcquiredCoin = placeTrade(CAKE, BUSD, trade2AcquiredCoin);

        // Check Profitability
        bool profCheck = checkProfitability(amountToRepay, trade3AcquiredCoin);
        require(profCheck, "Arbitrage not profitable");

        // Pay Myself
        IERC20 otherToken = IERC20(BUSD);
        otherToken.transfer(myAddress, trade3AcquiredCoin - amountToRepay);*/

        // Pay Loan Back
        IERC20(borrowTokenAddress).transfer(pairAddress, amountToRepay);
    }
}
