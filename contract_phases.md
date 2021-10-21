## What can be done in each Contract Phase

This is a detailed documentation of what **CAN** [not should]
be done in each contract phase. This is more useful for 
developers/auditors than end users. If you're looking for what 
should be done in each contract phase, please check out 
the walkthroughs. 

---

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
