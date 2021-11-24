# Collective NFT

_Submission for: https://gitcoin.co/issue/Zilliqa/Zilliqa/2715/100026477_ (1st place winner)

**Collective NFT** allows NFT owners on Zilliqa network to lock up their NFTs
as collateral, and mint fungible tokens representing a share of the locked-up 
NFTs. This allows them to make their NFTs more liquid and multiple lenders 
can then have a share. This contract also allows lenders to earn interest.

There are six possible phases for the contract:

* **Not started**: contract has just been created; no NFT is locked up.
* **Active**: there is at least one locked-up NFT; lenders can buy tokens.
* **Cancelled**: owner has cancelled the contract; only possible if there is no token in circulation (most probably nobody had bought any).
* **Closed**: owner has got enough loan and stopped selling tokens.
* **Expired**: everything went well; lenders can claim back their loan with interest; owner can unlock all NFTs.
* **Null**: owner hadn't fulfilled his part of the contract, therefore he has lost all locked-up NFTs.

If you're a developer or auditor, for more details, please visit [this page](contract_phases.md).

---

## Quick Start (for everyone)

### Learn: [NFT Owner Walkthrough](owner_walkthrough.md) | [Lenders Walkthrough](lenders_walkthrough.md)
### Use: [Telegram Bot](https://t.me/collective_nft_bot) (testnet) | [CollectiveNFT Web dApp](dapp)

Telegram bot is recommended. You can [make your own Telegram bot](your_own_bot.md) 
as well. 

___

## Basic Usage (for devs and auditors)

### 1. Deploy [CollectiveNFT.scilla](CollectiveNFT.scilla) with your desired immutables

```
contract_owner: ByStr20,
name : String,
symbol: String,
decimals: Uint32,
init_price: Uint128,
interest_ratio: Uint128,
burn_ratio: Uint128,
expiration_block: BNum
```

`init_price` is the price of your token in ZIL. If you set it to `2`, each of
your tokens will be sold for `2` ZIL (if `decimals = 12`).

`interest_ratio` is the percentage of interest buyer will get when the
contract period is over.

`burn_ratio` is the percentage of ZIL the contract refunds when burning
tokens before the end of contract period.
For example, if you set it to `70`, the contract will send back 70% of ZIL to
token burners (instead of a full refund).

`expiration_block` is the block number at which the contract expires, and
token owners get paid back with interest.
If there is not enough Zil liquidity at that time, contract owner will lose
all the locked NFTs.

### 2. Send your NFTs to the contract address
The contract will automatically list all received NFTs in a mutable map
(i.e. `wrapped_nft`). Anybody can send NFTs to the contract.

**_Note:_ You can't mint NFT for the smart contract directly. It won't be
accepted. This is because `RecipientAcceptMint` message from the standard
NFT contract doesn't contain `token_id`. No corresponding event is emitted
by the standard contract either.**
   
### 3. The smart contract is ready
Lenders can call `BuyTokens` with some Zil attached to buy your tokens.

### 4. Learn more
CollectiveNFT contract can have six different phases. [Learn more about each 
phase](contract_phases.md) to get a better understanding of how the 
contract flows.
   
___

## Unlocking NFTs

The contract owner can unlock all NFTs (i.e. send them away to another
address) only if the contract is _expired_ or _cancelled_. If you locked up 
your NFT and didn't sell any token, you can then `CancelContract` to be able to 
unlock and move your NFT. Cancelling contract is also possible if all buyers 
decide to burn their tokens, resulting in `total_supply = zero`. Obviously,
when the contract expires and all buyers are paid back, you can move away
your NFT as well.

---

## General QA

* ### How many NFTs can be locked up in a single contract?
  #### Two to the power of 128 which practically means there is no limit. However, beware of gas fees!

* ### What happens at the end of the contract period?
  #### Scenario #1: If there is enough Zil liquidity in the contract, everything ends well. Token owners get their Zil + interest, and all tokens are burnt. Contract is terminated, and contract owner can unlock his NFTs.
  #### Scenario #2: If there isn't enough Zil liquidity in the contract to pay back token owners, contract owner loses his NFTs. Minted tokens will represent the locked NFTs and can still be traded.

* ### What if my NFT has an ApprovedSpender?
  #### When you transfer your NFT to this contract, ApprovedSpender is automatically deleted. Please note that if your NFT contract is not the standard contract, this may not happen.

Please check the walkthroughs for more specific QAs.

---

## Alternative Solutions / Future Plans

* Let the contract owner set a limit for the amount of loan (Right now there 
is no hard limit for the maximum amount of loan. The contract owner can 
close the contract when he thinks he has got enough loan).

* Check approved spenders of a NFT explicitly to prevent non-standard NFT 
contracts from manipulating the collateralization (Right now we assume only
standard NFT contracts are interacting with this contract).

* If contract ended up in null status, token owners should be able to move
all tokens to one account to unlock the NFTs. (Right now, when the owner 
loses the NFTs, minted tokens will represent the NFT, and can be traded).
  
* Add reminder/notification feature to the Telegram bot and the dApp to 
notify interested parties when the expiration time is close.
