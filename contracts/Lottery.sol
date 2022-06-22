// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Lottery {
   using SafeERC20 for IERC20;
   address public payingToken;
   address public holderToken;
   address public teamWallet;

  // TODO : optimize the structure gas cost
  struct Ticket {
    address player;
    uint256[6] numbers;
  }

  // TODO : optimize structure for gas
  struct Scores {
   uint256 sixMatchesCount;
   uint256 fiveMatchesCount;
   uint256 fourMatchesCount;
   uint256 threeMatchesCount;
   uint256 twoMatchesCount;
  }
  Scores scores;

  Ticket[] public tickets;
  uint256[6] public drawnNumbers;

  uint256 USDPrice = 5 ether;
  uint256 totalCollected;

  event Bet(address indexed player, uint256[6] numbers);
  event Claimed(address indexed player, uint256 amount);

  constructor(
    address _payingToken,
    address _holderToken,
    address _teamWallet) {
      payingToken = _payingToken;
  }

  function convertUSDPriceToTokens() private view returns (uint256) {
    return USDPrice;
  }

  function bet(uint256[6] calldata numbers) external {
    // TODO : Check if possible to compress the uint256[6] ?
    // TODO : check if someone can play multiple times or not
    // TODO : check the numbers are unique
    // TODO : check that msg.sender holds enough holderToken to play
    // TODO : check numbers are ordered
    tickets.push(Ticket(msg.sender, numbers));
    uint256 amount = convertUSDPriceToTokens();
    totalCollected += amount;
    IERC20(payingToken).safeTransferFrom(msg.sender, address(this) ,amount);
    emit Bet(msg.sender, numbers);
  }

  function draw() external {
    // TODO : check access right : open to anyone ?
    // TODO : Check timing : is it the right time ?

    drawRandomNumbers();
    calculateRewardDivider();
  }

  function drawRandomNumbers() private {
    // Static so far.
    // Replace with real chainlink impl
    drawnNumbers = [1,2,3,5,7,11];
  }

  function calculateRewardDivider() private {
    for(uint256 i=0; i < tickets.length; i++) {
      uint256 matches = calculateMathCount(tickets[i].numbers, drawnNumbers);
      if (matches == 2) {scores.twoMatchesCount++; break;}
      if (matches == 3) {scores.threeMatchesCount++; break;}
      if (matches == 4) {scores.fourMatchesCount++; break;}
      if (matches == 5) {scores.fiveMatchesCount++; break;}
      if (matches == 6) {scores.sixMatchesCount++; break;}
    }
  }

  function calculateMathCount(uint256[6] memory a, uint256[6] memory b) public view returns (uint256) {
    // TODO : implement the real function
    return 6;
  }

  function claim() external {
    // TODO : check that the player cannot claim twice.

    // Find all tickets from msg.sender.
    // TODO : implement the loop
    // TODO : check the maxblock gas limit : how many tickets are allowed with this implementation ?

    // basic and naive impl
    Ticket memory ticket = tickets[0];
    uint256 reward = 0;

    uint256 totalReward = totalCollected * 65 / 100;

    // for each ticket, calculate the reward
    uint256 matches = calculateMathCount(ticket.numbers, drawnNumbers);
    if (matches == 6) {
      reward = totalReward * 30 / (100 * scores.sixMatchesCount);
    }
    if (matches == 5) {
      reward = totalReward * 10 / (100 * scores.sixMatchesCount);
    }
    if (matches == 4) {
      reward = totalReward * 10 / (100 * scores.sixMatchesCount);
    }
    if (matches == 3) {
      reward = totalReward * 15 / (100 * scores.sixMatchesCount);
    }
    if (matches == 2) {
      reward = totalReward * 35 / (100 * scores.sixMatchesCount);
    }

    // TODO : store that alice has already claimed

    // then pay the reward
    IERC20(payingToken).safeTransfer(msg.sender , reward);
    emit Claimed(msg.sender, reward);
  }

  // TODO : add other function for liquidity, staking and teams
}