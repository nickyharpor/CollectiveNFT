## What can be done in each Contract Phase

This is a detailed documentation of what **CAN** (_not should_)
be done in each contract phase. This is more useful for 
developers/auditors than end users. If you're looking for what 
should be done in each contract phase, please check out 
the walkthroughs. 

:bulb: CollectiveNFT contract is based on a **permissive** general policy. 
Unless it's cheating or abuse, actions are allowed in the contract. Some of 
these actions might not make much sense (e.g. closing a contract right 
after creating it), but are deliberately allowed in the contract for more 
flexibility. It's in the dApps that users are warned or stopped when they 
try to do pointless actions. Of course, any actions that can lead to cheating 
or any other misbehavior are NOT allowed in the contract.

Permissive general policy in the contract adds flexibility which might be 
useful in uncommon cases. For example, adding funds to the contract is 
possible from any account, not just the owner account. Generally, it's the 
owner who has to add funds to the contract to pay the interest, however, he 
can make use of this flexibility to add funds from his secondary account 
(otherwise he had to first move funds from the secondary account to his 
primary account, and then add funds to the contract from the primary account).

Here is a list of actions possible in each contract phase:

### Not Started

#### Owner can

* send NFTs to the contract (from any account)
* add funds to the contract (in vain and unnecessary, but 
  it's possible to add funds beforehand from any account)
* cancel the contract (in case he changed his mind)
* close the contract (in case he wanted to waste gas)

#### Lenders can

* do nothing (but waiting)

---

### Active

#### Owner can

* still send NFTs to the contract (increasing the collateral 
  while the contract is in action harms no lenders)
* add funds to the contract (it's still unnecessary)
* move funds to other accounts (to put them in use)
* cancel the contract (only if nobody has bought a token yet)
* close the contract (to stop minting new tokens)
* buy tokens (if he wants to lend money to himself)
* transfer tokens (maybe to help people in need!)
* burn tokens (possible, but a terrible idea)

#### Lenders can

* buy tokens (to lend money)
* transfer tokens (they can sell their tokens to others 
  via other avenues)
* burn tokens (if they need their money sooner than the 
  expiration block; but if there isn't enough Zil liquidity 
  at the moment, they can't burn their tokens)

---

### Closed

#### Owner can

* add funds to the contract (to make sure he can pay back 
  all lenders with interest)
* move funds to other accounts (to put them in use)
* cancel the contract (only if nobody has bought a token yet)
* buy tokens (if he wants to lend money to himself)
* transfer tokens (maybe to help people in need!)
* burn tokens (possible, but a terrible idea)

#### Lenders can

* transfer tokens (they can sell their tokens to others
  via other avenues)
* burn tokens (if they need their money sooner than the
  expiration block; but if there isn't enough Zil liquidity
  at the moment, they can't burn their tokens)

---

### Cancelled

#### Owner can

* remove NFTs from the contract (i.e. sending NFTs away)
* add funds to the contract (no point in doing so, but possible)
* move funds to other accounts (if there is any)

#### Lenders can

* do nothing (but watching)

---

### Expired

#### Owner can

* remove NFTs from the contract (i.e. sending NFTs away)
* transfer tokens (if he had bought a token from himself)
* claim funds (if he had bought a token from himself)

#### Lenders can

* transfer tokens (they can still sell their tokens to 
  others via other avenues)
* claim funds (to be paid back with interest)

---

### Null

#### Owner can

* transfer tokens (if he had bought a token from himself)
* claim funds (if he had bought a token from himself, 
  but probably there is no Zil liquidity to do so)

#### Lenders can

* transfer tokens (they can still sell their tokens to
  others via other avenues)
* claim funds (to be paid back with interest, if there 
  is enough Zil liquidity)
