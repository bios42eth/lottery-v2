# Use cases & Business rules
- 🚧 Allow player bet on 6 numbers from 1 to 59
Draws take place at 21:00 UTC on Wednesdays and Saturdays.
Ticket sales for each draw close 30 minutes earlier at 20:30 UTC
  - handle time restriction
  - handle the ticket price (5$-dynamic)
  - split funds :
    ✅ 65% goes to the SAFEMOON prize pool
    10% goes to the SAFEMOON liquidity pool
    10% goes to the SAFEMOON staking pool
    10% goes to SAFEMOON team wallet
    5% goes to mytoken team wallet
  - The player that wants to play the lottery needs to hold a determined amount of the partner token or of $mytoken.

- Connect chainlink random generator
  - See how it works
  - Mock the interface
  - Get LINK faucet
  - Configure a chainlink project

- weekly draw
  - distribute reward
    ✅ Match 6 30% (Jackpot)
    ✅ Match 5 10%
    ✅ Match 4 10%
    ✅ Match 3 15%
    ✅ Match 2 35%
  - clear tickets

- Create a lottery
  -  pay 1BNB to the token team (how do we know their wallet ?)

# Plan
- 🚧 Implement basic bet (one single lottery)
- 🚧 Implement basic draw (one single lottery)
- Add liquidity, staking and teams transfer
- Expand to multiple lotteries
- Implement ticket price peg
- Integrate chainlink generator
- Optimize for gas
- Check slither
- deploy & test on testnet

# Open questions
- Can a same wallet purchase multiple tickets ?
- Can the same lottery be run multiple times or should it be recreated everytime.
- Time validity check for draw : onchain or offchain ?
- When shall we distribute to liquidity, staking and teams ?
