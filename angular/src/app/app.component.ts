import {AfterContentInit, AfterViewInit, Component, Inject, OnInit} from '@angular/core';
import {interval} from "rxjs";
import {FormControl, Validators} from "@angular/forms";
import {delay} from "rxjs/operators";


declare var window: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
//General
  title = 'zilliqa-front';
  walletConnected = false;
  sameUserAndOwner = false;
  userAdd32: any = '';
  userAdd16: any = '';
  txGasLimit = 18000;
  latestBlockNo: number = 0;
  contractStr = '(* CollectiveNFT contract *)\n' +
    '\n' +
    '(***************************************************)\n' +
    '(*                 Scilla version                  *)\n' +
    '(***************************************************)\n' +
    '\n' +
    '(* 0.7.1 *)\n' +
    'scilla_version 0\n' +
    '\n' +
    '(***************************************************)\n' +
    '(*               Associated library                *)\n' +
    '(***************************************************)\n' +
    '\n' +
    'import BoolUtils PairUtils IntUtils ListUtils\n' +
    'library CollectiveNFT\n' +
    '\n' +
    'let true = True\n' +
    'let false = False\n' +
    'let zero = Uint128 0\n' +
    'let one = Uint256 1\n' +
    'let hundred = Uint128 100\n' +
    'let one_o_one = Uint128 101\n' +
    '\n' +
    'let contract_is_not_started_status = Uint32 100\n' +
    'let contract_is_active_status = Uint32 200\n' +
    'let contract_is_closed_status = Uint32 300\n' +
    'let contract_is_cancelled_status = Uint32 400\n' +
    'let contract_is_expired_status = Uint32 500\n' +
    'let contract_is_null_status = Uint32 600\n' +
    '\n' +
    'let one_msg =\n' +
    '  fun (msg : Message) =>\n' +
    '    let nil_msg = Nil {Message} in\n' +
    '    Cons {Message} msg nil_msg\n' +
    '\n' +
    'let two_msgs =\n' +
    'fun (msg1 : Message) =>\n' +
    'fun (msg2 : Message) =>\n' +
    '  let msgs_tmp = one_msg msg2 in\n' +
    '  Cons {Message} msg1 msgs_tmp\n' +
    '\n' +
    'let build_nft =\n' +
    '  fun (nft_contract_address : ByStr20) =>\n' +
    '  fun (token_id : Uint256) =>\n' +
    '    Pair {ByStr20 Uint256} nft_contract_address token_id\n' +
    '\n' +
    'let get_val =\n' +
    '  fun (some_val: Option Uint128) =>\n' +
    '  match some_val with\n' +
    '  | Some val => val\n' +
    '  | None => zero\n' +
    '  end\n' +
    '\n' +
    '(* Error exception *)\n' +
    'type Error =\n' +
    '  | CodeNotContractOwner\n' +
    '  | CodeIsSelf\n' +
    '  | CodeCannotAddNFTInThisPhase\n' +
    '  | CodeCannotBuyTokenInThisPhase\n' +
    '  | CodeInsufficientFunds\n' +
    '  | CodeNFTDoesNotExist\n' +
    '  | CodeContractHasExpired\n' +
    '  | CodeCannotRemoveNFTInThisPhase\n' +
    '  | CodeCannotCloseContractInThisPhase\n' +
    '  | CodeNotTokenOwner\n' +
    '  | CodeCannotBurnTokensInThisPhase\n' +
    '  | CodeContractHasNotExpired\n' +
    '\n' +
    'let make_error =\n' +
    '  fun (result : Error) =>\n' +
    '    let result_code =\n' +
    '      match result with\n' +
    '      | CodeNotContractOwner                => Int32 -1\n' +
    '      | CodeIsSelf                          => Int32 -2\n' +
    '      | CodeCannotAddNFTInThisPhase         => Int32 -3\n' +
    '      | CodeCannotBuyTokenInThisPhase       => Int32 -4\n' +
    '      | CodeInsufficientFunds               => Int32 -5\n' +
    '      | CodeNFTDoesNotExist                 => Int32 -6\n' +
    '      | CodeContractHasExpired              => Int32 -7\n' +
    '      | CodeCannotRemoveNFTInThisPhase      => Int32 -8\n' +
    '      | CodeCannotCloseContractInThisPhase  => Int32 -9\n' +
    '      | CodeNotTokenOwner                   => Int32 -10\n' +
    '      | CodeCannotBurnTokensInThisPhase     => Int32 -11\n' +
    '      | CodeContractHasNotExpired           => Int32 -12\n' +
    '      end\n' +
    '    in\n' +
    '    { _exception : "Error"; code : result_code }\n' +
    '\n' +
    '(***************************************************)\n' +
    '(*             The contract definition             *)\n' +
    '(***************************************************)\n' +
    '\n' +
    'contract CollectiveNFT\n' +
    '(\n' +
    '  contract_owner: ByStr20,\n' +
    '  name : String,\n' +
    '  symbol: String,\n' +
    '  decimals: Uint32,\n' +
    '  init_price: Uint128,\n' +
    '  interest_ratio: Uint128,\n' +
    '  burn_ratio: Uint128,\n' +
    '  expiration_block: BNum\n' +
    ')\n' +
    'with\n' +
    '  let c1 = builtin blt _creation_block expiration_block in\n' +
    '  let c2 = builtin lt burn_ratio one_o_one in\n' +
    '  andb c1 c2\n' +
    '=>\n' +
    '\n' +
    '(* Mutable fields *)\n' +
    '\n' +
    'field total_supply : Uint128 = zero\n' +
    '\n' +
    '(* Price can\'t be changed in this version of contract *)\n' +
    'field current_price : Uint128 = init_price\n' +
    '\n' +
    'field balances: Map ByStr20 Uint128\n' +
    '  = let emp_map = Emp ByStr20 Uint128 in\n' +
    '    builtin put emp_map contract_owner zero\n' +
    '\n' +
    'field allowances: Map ByStr20 (Map ByStr20 Uint128)\n' +
    '  = Emp ByStr20 (Map ByStr20 Uint128)\n' +
    '\n' +
    'field contract_status : Uint32 = contract_is_not_started_status\n' +
    '\n' +
    '(* Number of NFTs this contract wraps a.k.a NFT number for each NFT Pair *)\n' +
    'field nft_count: Uint256 = Uint256 0\n' +
    '\n' +
    '(* Mapping from NFT number to NFT Pair *)\n' +
    'field wrapped_nft: Map Uint256 Pair ByStr20 Uint256 = Emp Uint256 Pair ByStr20 Uint256\n' +
    '\n' +
    '(**************************************)\n' +
    '(*             Procedures             *)\n' +
    '(**************************************)\n' +
    '\n' +
    '(* Emit Errors *)\n' +
    'procedure ThrowError(err : Error)\n' +
    '  e = make_error err;\n' +
    '  throw e\n' +
    'end\n' +
    '\n' +
    'procedure CheckBlock()\n' +
    '  (* don\'t check if contract status is already expired, cancelled, or nulled *)\n' +
    '  current_status <- contract_status;\n' +
    '  is_already_expired = builtin eq current_status contract_is_expired_status;\n' +
    '  is_null = builtin eq current_status contract_is_null_status;\n' +
    '  is_cancelled = builtin eq current_status contract_is_cancelled_status;\n' +
    '  is_expired_or_null = orb is_already_expired is_null;\n' +
    '  is_any = orb is_cancelled is_expired_or_null;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '    | False =>\n' +
    '      blk <- & BLOCKNUMBER;\n' +
    '      is_expired = builtin blt expiration_block blk;\n' +
    '      match is_expired with\n' +
    '        | True =>\n' +
    '          (* check if there is enough liquidity *)\n' +
    '          current_total_supply <- total_supply;\n' +
    '          price <- current_price;\n' +
    '          received_zil = builtin div current_total_supply price;\n' +
    '          zil_with_interest_times_hundred = builtin mul received_zil interest_ratio;\n' +
    '          zil_with_interest = builtin div zil_with_interest_times_hundred hundred;\n' +
    '          bal <- _balance;\n' +
    '          is_liquidity_enough = uint128_le zil_with_interest bal;\n' +
    '          match is_liquidity_enough with\n' +
    '            | True =>\n' +
    '              contract_status := contract_is_expired_status\n' +
    '            | False =>\n' +
    '              contract_status := contract_is_null_status\n' +
    '          end\n' +
    '        | False =>\n' +
    '      end\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure ContractIsNotExpired()\n' +
    '  CheckBlock;\n' +
    '  current_status <- contract_status;\n' +
    '  is_expired = builtin eq current_status contract_is_expired_status;\n' +
    '  is_null = builtin eq current_status contract_is_null_status;\n' +
    '  is_any = orb is_expired is_null;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '      err = CodeContractHasExpired;\n' +
    '      ThrowError err\n' +
    '    | False =>\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure ContractIsExpiredOrNull()\n' +
    '  current_status <- contract_status;\n' +
    '  is_expired = builtin eq current_status contract_is_expired_status;\n' +
    '  is_null = builtin eq current_status contract_is_null_status;\n' +
    '  is_any = orb is_expired is_null;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '    | False =>\n' +
    '      err = CodeContractHasNotExpired;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure CanCloseContract()\n' +
    '  current_status <- contract_status;\n' +
    '  is_not_started = builtin eq current_status contract_is_not_started_status;\n' +
    '  is_active = builtin eq current_status contract_is_active_status;\n' +
    '  is_any = orb is_not_started is_active;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '    | False =>\n' +
    '      err = CodeCannotCloseContractInThisPhase;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure CanBurnTokens()\n' +
    '  current_status <- contract_status;\n' +
    '  is_closed = builtin eq current_status contract_is_closed_status;\n' +
    '  is_active = builtin eq current_status contract_is_active_status;\n' +
    '  is_any = orb is_closed is_active;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '    | False =>\n' +
    '      is_null = builtin eq current_status contract_is_null_status;\n' +
    '      match is_null with\n' +
    '        | True =>\n' +
    '        | False =>\n' +
    '          err = CodeCannotBurnTokensInThisPhase;\n' +
    '          ThrowError err\n' +
    '      end\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure CanRemoveNFTs()\n' +
    '  current_status <- contract_status;\n' +
    '  is_cancelled = builtin eq current_status contract_is_cancelled_status;\n' +
    '  is_expired = builtin eq current_status contract_is_expired_status;\n' +
    '  is_any = orb is_cancelled is_expired;\n' +
    '  match is_any with\n' +
    '    | True =>\n' +
    '    | False =>\n' +
    '      err = CodeCannotRemoveNFTInThisPhase;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    '(*@param contractAddress - address of NFT contract*)\n' +
    '(*@param tokenID - NFT token ID*)\n' +
    '(*@param to - address of receiver*)\n' +
    'procedure TransferNFT (contract_address: ByStr20, token_id: Uint256, to: ByStr20)\n' +
    '  transfered = {\n' +
    '    _tag: "Transfer";\n' +
    '    _recipient: contract_address;\n' +
    '    _amount: Uint128 0;\n' +
    '    to: to;\n' +
    '    token_id: token_id\n' +
    '  };\n' +
    '  msgs = one_msg transfered;\n' +
    '  send msgs\n' +
    'end\n' +
    '\n' +
    'procedure TransferZIL (to: ByStr20, amount: Uint128)\n' +
    '  msg  = {_tag : ""; _recipient : to; _amount : amount};\n' +
    '  msgs = one_msg msg;\n' +
    '  send msgs\n' +
    'end\n' +
    '\n' +
    'procedure AuthorizedMoveIfSufficientBalance(from: ByStr20, to: ByStr20, amount: Uint128)\n' +
    '  o_from_bal <- balances[from];\n' +
    '  bal = get_val o_from_bal;\n' +
    '  can_do = uint128_le amount bal;\n' +
    '  match can_do with\n' +
    '  | True =>\n' +
    '    (* Subtract amount from from and add it to to address *)\n' +
    '    new_from_bal = builtin sub bal amount;\n' +
    '    balances[from] := new_from_bal;\n' +
    '    (* Adds amount to to address *)\n' +
    '    get_to_bal <- balances[to];\n' +
    '    new_to_bal = match get_to_bal with\n' +
    '    | Some bal => builtin add bal amount\n' +
    '    | None => amount\n' +
    '    end;\n' +
    '    balances[to] := new_to_bal\n' +
    '  | False =>\n' +
    '    (* Balance not sufficient *)\n' +
    '    err = CodeInsufficientFunds;\n' +
    '    ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure IsContractOwner()\n' +
    '  is_contract_owner = builtin eq contract_owner _sender;\n' +
    '  match is_contract_owner with\n' +
    '  | True =>\n' +
    '  | False =>\n' +
    '    err = CodeNotContractOwner;\n' +
    '    ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'procedure AcceptNFT(from : ByStr20, token_id : Uint256)\n' +
    '  accept;\n' +
    '  input_nft = build_nft from token_id;\n' +
    '  current_nft_count <- nft_count;\n' +
    '  new_nft_count = builtin add current_nft_count one;\n' +
    '  nft_count := new_nft_count;\n' +
    '  nft_id <- nft_count;\n' +
    '  wrapped_nft[nft_id] := input_nft\n' +
    'end\n' +
    '\n' +
    '(***************************************)\n' +
    '(*             Transitions             *)\n' +
    '(***************************************)\n' +
    '\n' +
    '(* Tokens are sold only when contract is active *)\n' +
    '(*{status == active}*)\n' +
    'transition BuyTokens()\n' +
    '  ContractIsNotExpired;\n' +
    '  current_status <- contract_status;\n' +
    '  is_active = builtin eq current_status contract_is_active_status;\n' +
    '  match is_active with\n' +
    '    | True =>\n' +
    '      accept;\n' +
    '      price <- current_price;\n' +
    '      add_bal = builtin mul _amount price;\n' +
    '      o_from_bal <- balances[_sender];\n' +
    '      bal = get_val o_from_bal;\n' +
    '      new_bal = builtin add bal add_bal;\n' +
    '      balances[_sender] := new_bal;\n' +
    '      current_total_supply <- total_supply;\n' +
    '      new_total_supply = builtin add current_total_supply add_bal;\n' +
    '      total_supply := new_total_supply\n' +
    '    | False =>\n' +
    '      err = CodeCannotBuyTokenInThisPhase;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    '(* @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. *)\n' +
    '(* @dev: Balance of recipient will increase. Balance of _sender will decrease.      *)\n' +
    '(* @param to:  Address of the recipient whose balance is increased.                 *)\n' +
    '(* @param amount:     Amount of tokens to be sent.                                  *)\n' +
    'transition TransferTokens(to: ByStr20, amount: Uint128)\n' +
    '  CheckBlock;\n' +
    '  AuthorizedMoveIfSufficientBalance _sender to amount;\n' +
    '  e = {_eventname : "TransferSuccess"; sender : _sender; recipient : to; amount : amount};\n' +
    '  event e;\n' +
    '  (* Prevent sending to a contract address that does not support transfers of token *)\n' +
    '  msg_to_recipient = {_tag : "RecipientAcceptTransfer"; _recipient : to; _amount : zero;\n' +
    '                      sender : _sender; recipient : to; amount : amount};\n' +
    '  msg_to_sender = {_tag : "TransferSuccessCallBack"; _recipient : _sender; _amount : zero;\n' +
    '                  sender : _sender; recipient : to; amount : amount};\n' +
    '  msgs = two_msgs msg_to_recipient msg_to_sender;\n' +
    '  send msgs\n' +
    'end\n' +
    '\n' +
    '(* Token owners can burn their tokens before the end of the contract period *)\n' +
    '(*{status == active, closed, null}*)\n' +
    'transition BurnTokens(amount: Uint128)\n' +
    '  CheckBlock;\n' +
    '  CanBurnTokens;\n' +
    '  is_amount_zero = builtin eq amount zero;\n' +
    '  o_from_bal <- balances[_sender];\n' +
    '  bal = get_val o_from_bal;\n' +
    '  is_balance_zero = builtin eq bal zero;\n' +
    '  dont_continue = orb is_amount_zero is_balance_zero;\n' +
    '  match dont_continue with\n' +
    '    | False =>\n' +
    '      can_do = uint128_le amount bal;\n' +
    '      match can_do with\n' +
    '        | False =>\n' +
    '          (* Burn it all! *)\n' +
    '          balances[_sender] := zero;\n' +
    '          current_total_supply <- total_supply;\n' +
    '          new_total_supply = builtin sub current_total_supply bal;\n' +
    '          total_supply := new_total_supply;\n' +
    '          price <- current_price;\n' +
    '          original_zil_equivalent = builtin div bal price;\n' +
    '          zil_to_refund_times_hundred = builtin mul original_zil_equivalent burn_ratio;\n' +
    '          zil_to_refund = builtin div zil_to_refund_times_hundred hundred;\n' +
    '          TransferZIL _sender zil_to_refund\n' +
    '        | True =>\n' +
    '          new_bal = builtin sub bal amount;\n' +
    '          balances[_sender] := new_bal;\n' +
    '          current_total_supply <- total_supply;\n' +
    '          new_total_supply = builtin sub current_total_supply amount;\n' +
    '          total_supply := new_total_supply;\n' +
    '          price <- current_price;\n' +
    '          original_zil_equivalent = builtin div amount price;\n' +
    '          zil_to_refund_times_hundred = builtin mul original_zil_equivalent burn_ratio;\n' +
    '          zil_to_refund = builtin div zil_to_refund_times_hundred hundred;\n' +
    '          TransferZIL _sender zil_to_refund\n' +
    '      end\n' +
    '    | True =>\n' +
    '      err = CodeInsufficientFunds;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    '(* Owner can cancel contract only when there is no token in circulation *)\n' +
    '(*{status == not_started, active, closed}*)\n' +
    'transition CancelContract()\n' +
    '  ContractIsNotExpired;\n' +
    '  IsContractOwner;\n' +
    '  current_total_supply <- total_supply;\n' +
    '  is_zero = builtin eq current_total_supply zero;\n' +
    '  match is_zero with\n' +
    '    | True =>\n' +
    '      contract_status := contract_is_cancelled_status\n' +
    '    | False =>\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    '(*{status == not_started, active}*)\n' +
    'transition CloseContract()\n' +
    '  ContractIsNotExpired;\n' +
    '  CanCloseContract;\n' +
    '  IsContractOwner;\n' +
    '  contract_status := contract_is_closed_status\n' +
    'end\n' +
    '\n' +
    '(*{status == not_started, active, closed}*)\n' +
    'transition AddFunds()\n' +
    '  ContractIsNotExpired;\n' +
    '  accept\n' +
    'end\n' +
    '\n' +
    '(*{status != expired, null}*)\n' +
    'transition MoveFunds(to: ByStr20, amount: Uint128)\n' +
    '  ContractIsNotExpired;\n' +
    '  IsContractOwner;\n' +
    '  TransferZIL to amount\n' +
    'end\n' +
    '\n' +
    '(*{status == expired, null}*)\n' +
    'transition ClaimFunds()\n' +
    '  CheckBlock;\n' +
    '  ContractIsExpiredOrNull;\n' +
    '  o_from_bal <- balances[_sender];\n' +
    '  bal = get_val o_from_bal;\n' +
    '  is_balance_zero = builtin eq bal zero;\n' +
    '  match is_balance_zero with\n' +
    '    | True =>\n' +
    '      err = CodeNotTokenOwner;\n' +
    '      ThrowError err\n' +
    '    | False =>\n' +
    '      (* Calculate interest *)\n' +
    '      price <- current_price;\n' +
    '      amount = builtin div bal price;\n' +
    '      interest_mul = builtin add interest_ratio hundred;\n' +
    '      with_interest_times_hundred = builtin mul amount interest_mul;\n' +
    '      with_interest = builtin div with_interest_times_hundred hundred;\n' +
    '      balances[_sender] := zero;\n' +
    '      current_total_supply <- total_supply;\n' +
    '      new_total_supply = builtin sub current_total_supply bal;\n' +
    '      total_supply := new_total_supply;\n' +
    '      TransferZIL _sender with_interest\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    '(* Owner can send away NFTs when contract is cancelled or expired with interests paid *)\n' +
    '(*{status == expired, cancelled}*)\n' +
    'transition RemoveNFT(to: ByStr20, nft_num: Uint256)\n' +
    '  CheckBlock;\n' +
    '  CanRemoveNFTs;\n' +
    '  nft_exists <- exists wrapped_nft[nft_num];\n' +
    '  match nft_exists with\n' +
    '    | True =>\n' +
    '      nft_option <- wrapped_nft[nft_num];\n' +
    '      match nft_option with\n' +
    '        | Some val =>\n' +
    '          nft = val;\n' +
    '          get_nft_contract = @fst ByStr20 Uint256;\n' +
    '          nft_contract = get_nft_contract nft;\n' +
    '          get_token_id = @snd ByStr20 Uint256;\n' +
    '          token_id = get_token_id nft;\n' +
    '          TransferNFT nft_contract token_id to;\n' +
    '          delete wrapped_nft[nft_num];\n' +
    '          current_nft_count <- nft_count;\n' +
    '          new_nft_count = builtin sub current_nft_count one;\n' +
    '          nft_count := new_nft_count\n' +
    '        | None =>\n' +
    '      end\n' +
    '    | False =>\n' +
    '      err = CodeNFTDoesNotExist;\n' +
    '      ThrowError err\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'transition UpdateStatus()\n' +
    '  CheckBlock\n' +
    'end\n' +
    '\n' +
    'transition RecipientAcceptTransfer\n' +
    '(from : ByStr20, recipient : ByStr20, token_id : Uint256)\n' +
    '  ContractIsNotExpired;\n' +
    '  current_status <- contract_status;\n' +
    '  is_not_started = builtin eq current_status contract_is_not_started_status;\n' +
    '  match is_not_started with\n' +
    '    | True =>\n' +
    '      AcceptNFT _sender token_id;\n' +
    '      contract_status := contract_is_active_status\n' +
    '    | False =>\n' +
    '      is_active = builtin eq current_status contract_is_active_status;\n' +
    '      match is_active with\n' +
    '        | True =>\n' +
    '          AcceptNFT _sender token_id\n' +
    '        | False =>\n' +
    '          err = CodeCannotAddNFTInThisPhase;\n' +
    '          ThrowError err\n' +
    '      end\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'transition RecipientAcceptTransferFrom\n' +
    '(from : ByStr20, recipient : ByStr20, token_id : Uint256)\n' +
    '  ContractIsNotExpired;\n' +
    '  current_status <- contract_status;\n' +
    '  is_not_started = builtin eq current_status contract_is_not_started_status;\n' +
    '  match is_not_started with\n' +
    '    | True =>\n' +
    '      AcceptNFT _sender token_id;\n' +
    '      contract_status := contract_is_active_status\n' +
    '    | False =>\n' +
    '      is_active = builtin eq current_status contract_is_active_status;\n' +
    '      match is_active with\n' +
    '        | True =>\n' +
    '          AcceptNFT _sender token_id\n' +
    '        | False =>\n' +
    '          err = CodeCannotAddNFTInThisPhase;\n' +
    '          ThrowError err\n' +
    '      end\n' +
    '  end\n' +
    'end\n' +
    '\n' +
    'transition TransferSuccessCallBack\n' +
    '(from : ByStr20, recipient : ByStr20, token_id : Uint256)\n' +
    'end\n' +
    '\n' +
    '\n';
//check
  showCheckError: boolean = false;
  checkErrorMessage: string = '';
  showCheckRes = false;
  contractBalance: any;
  contractCurrentPrice: any;
  contractNFTCount: any;
  contractTotalSupply: any;
  contractAdd: string = '';
  contractNFTs: { conAdd: string, id: string }[] = [];
  checkName: string = '';
  checkSymbol: string = '';
  checkExpirationBlock: number = 0;
  checkInterestRatio: number = 0;
  checkBurnRatio: number = 0;
  checkInitPrice: number = 0;
  checkDecimal: number = 0;
  checkCreationBlock: number = 0;
  checkContractOwnerAdd: string = '';
  checkContractStatus: string = '';
//create
  showCreateError: boolean = false;
  createErrorMessage: string = '';
  showCreateDetails = true;
  showCreateRes = false;
  createName: string = '';
  createSymbol: string = '';
  createExpirationYear: number = 0;
  createExpirationMonth: number = 0;
  createExpirationDay: number = 0;
  createExpirationBlock: number = 0;
  createTokenPrice: number = 0;
  createInterestRatio: number = 0;
  createBurnRatio: number = 0;
  createInitPrice: number = 1;
  createDecimal: number = 3;
  creatResAdd: string = '';
  createTnxID: string = '';
  creatResGasPrice: string = '';
  // buy
  buyAmount: number = 0;
  showBuyForm: boolean = true;
  showBuyRes: boolean = false;
  buyInfo: string = '';
  buyTranID: string = '';
  buyGas: number = 0;
  buyZilPrice: number = 0;
  showTransferForm: boolean = true;
  showTransferRes: boolean = false;
  transferToAddress: string = '';
  transferAmount: number = 1;
  transferTranID: string = '';
  transferInfo: string = '';
  transferGas: number = 0;
//burn
  showBurnForm: boolean = true;
  showBurnRes: boolean = false;
  burnAmount: number = 0;
  burnTranID: string = '';
  burnInfo: string = '';
  burnGas: number = 0;
//addFund
  showAddFundForm: boolean = true;
  showAddFundRes: boolean = false;
  addFundAmount: number = 0;
  addFundTranID: string = '';
  addFundInfo: string = '';
  addFundGas: number = 0;
//claimFund
  showClaimFundForm: boolean = true;
  showClaimFundRes: boolean = false;
  claimFundAmount: number = 0;
  claimFundTranID:number=0;
//close contract
  showCloseForm: boolean = true;
  showCloseRes: boolean = false;
  closeResMessage: string = '';
  closeTranID:number=0;
  //cancel contract
  showCancelForm: boolean = true;
  showCancelRes: boolean = false;
  cancelResMessage: string = '';
  cancelTranID:number=0;
  //unlock contract
  showUnlockForm: boolean = true;
  showUnlockRes: boolean = false;
  unlockToAdd: string = '';
  unlockNFTID: string = '';
  unlockResMessage: string = '';
  unlockTranID:number=0;
  //unlock contract
  showMoveForm: boolean = true;
  showMoveRes: boolean = false;
  moveToAdd: string = '';
  moveAmount: string = '';
  moveResMessage: string = '';
  moveTranID:number=0;
  ngAfterContentInit() {
    let d = new Date();
    d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000 + 24 * 60 * 60 * 1000);
    let dateParts = d.toLocaleDateString('en-GB').split('/');
    this.createExpirationYear = Number(dateParts[2]);
    this.createExpirationMonth = Number(dateParts[1]);
    this.createExpirationDay = Number(dateParts[0]);
    // this.createExpirationDateChange()
    window.addEventListener("load", async () => {
      if (!window.zilPay) {
        console.log("zilPay library not found")
      } else if (!window.zilPay.wallet.isEnable) {
        console.log("zilPay wallet is not enabled")
      }
      this.connectWallet();
    });
  }


  getUserAdd() {
    const myObserver = {
      next: (account: any) => {
        this.userAdd32 = account.bech32;
        this.userAdd16 = account.base16;
      },
      error: (err: Error) => console.error('Observer got an error: ' + err),
      complete: (x: any) => {
      },
    };
    window.zilPay.wallet.observableAccount().subscribe(myObserver);
  }

  async getLatestBlockNO() {
    const blockchain = window.zilPay.blockchain;
    await blockchain.getLatestTxBlock().then((data: any) => {
      this.latestBlockNo = data.result.header.BlockNum
    }, (error: any) => {
      console.log("Error fetching blockchain details... ", error)
    })
  }

  async connectWallet() {
    window.zilPay.wallet.connect().then(function (retVal: any) {
    })
    this.getUserAdd()
    this.getLatestBlockNO()
    if (window.zilPay.wallet.isConnect) {
      this.walletConnected = true;
    }
  }

  async getContractState(contractAdd: string): Promise<any> {
    const zilPay = window.zilPay;
    let contract = zilPay.contracts.at(contractAdd);
    let state = await contract.getState();
    return state;
  }

  async getContractInit(contractAdd: string): Promise<any> {
    const zilPay = window.zilPay;
    let contract = zilPay.contracts.at(contractAdd);
    let init = await contract.getInit();
    return init;
  }


  checkAddChange() {
    this.contractNFTs = [];
    this.connectWallet();
    if (this.contractAdd.length == 40)
      this.contractAdd = '0x' + this.contractAdd
    if (this.contractAdd.length == 42)
      this.getContractInit(this.contractAdd).then(data => {
        data.forEach((element: any) => {
          if (element.vname == 'init_price')
            this.checkInitPrice = element.value;
          if (element.vname == 'contract_owner')
            this.checkContractOwnerAdd = element.value;
          if (element.vname == 'name')
            this.checkName = element.value;
          if (element.vname == 'symbol')
            this.checkSymbol = element.value;
          if (element.vname == 'decimals')
            this.checkDecimal = element.value;
          if (element.vname == 'interest_ratio')
            this.checkInterestRatio = element.value;
          if (element.vname == 'burn_ratio')
            this.checkBurnRatio = element.value;
          if (element.vname == 'expiration_block')
            this.checkExpirationBlock = element.value;
          if (element.vname == '_creation_block')
            this.checkCreationBlock = element.value;
          if (element.vname == '_this_address')
            this.contractAdd = element.value;

        });
        this.getContractState(this.contractAdd).then(data => {
          this.contractBalance = Number(data._balance) / Math.pow(10, 12);
          this.contractTotalSupply = Number(data.total_supply) / Math.pow(10, this.checkDecimal);
          this.contractCurrentPrice = Number(Math.pow(10, this.checkDecimal) / Number(data.current_price)) / Math.pow(10, 12);
          this.checkContractStatus = data.contract_status;
          {
            if (this.checkContractStatus == '100')
              this.checkContractStatus = '⭕️ Not Started (no NFT locked)'
            if (this.checkContractStatus == '200')
              this.checkContractStatus = '🟢 Active (you can buy tokens)'
            if (this.checkContractStatus == '300')
              this.checkContractStatus = '🟡 Closed (waiting for expiration)'
            if (this.checkContractStatus == '400')
              this.checkContractStatus = '🚫 Cancelled (by owner)'
            if (this.checkContractStatus == '500')
              this.checkContractStatus = '⌛️ Expired (interest paid)'
            if (this.checkContractStatus == '600')
              this.checkContractStatus = '☠️ Null and Void (owner lost locked-up NFTs)'

          }
          for (let key in data.wrapped_nft) {
            this.contractNFTs.push({
              "conAdd": data.wrapped_nft[key].arguments[0],
              "id": data.wrapped_nft[key].arguments[1]
            })
          }

          this.contractNFTCount = data.nft_count;
          this.showCheckRes = true;
          if (this.userAdd16.toLowerCase() == this.checkContractOwnerAdd.toLowerCase())
            this.sameUserAndOwner = true;
          else
            this.sameUserAndOwner = false;
        }, data => console.log("failed", data))

      }, data => {
        this.contractAdd = '';
        this.checkSymbol = ''
        this.checkSymbol = ''
        this.checkDecimal = 0;
        this.checkName = ''
        this.checkInterestRatio = 0;
        this.checkBurnRatio = 0;
        this.checkExpirationBlock = this.latestBlockNo
        this.checkInitPrice = 0
        this.showCheckRes = false
        this.showCheckError = true;
        this.checkErrorMessage = data.message;
        interval(8000).subscribe((func => {
          this.wipeErrors()
        }))
      })

  }

  wipeErrors() {
    this.showCheckError = false;
    this.checkErrorMessage = '';
    this.showCreateError = false;
    this.createErrorMessage = '';

  }

  isInt(n: any) {
    return Number(n) === n && n % 1 === 0;
  }

  isFloat(n: any) {
    return Number(n) === n && n % 1 !== 0;
  }


  tokenPriceConvert() {
    if (this.createTokenPrice != null) {
      let initP = 1 / Number(this.createTokenPrice);
      if (initP != Infinity) {
        let deci = 12;
        while (!this.isInt(initP)) {
          initP *= 10;
          deci += 1;
        }
        while (initP % 10 == 0) {
          initP /= 10;
          deci -= 1;
        }
        this.createInitPrice = initP;
        this.createDecimal = deci
      }
    }

  }

  async deployContract() {
    const zilliqa = window.zilPay;
    const {units, Long, toChecksumAddress} = zilliqa.utils;
    const init = [
      {
        "vname": "_scilla_version",
        "type": "Uint32",
        "value": "0"
      },
      {
        "vname": "contract_owner",
        "type": "ByStr20",
        "value": this.userAdd16
      },
      {
        "vname": "name",
        "type": "String",
        "value": this.createName
      },
      {
        "vname": "symbol",
        "type": "String",
        "value": this.createSymbol
      },
      {
        "vname": "decimals",
        "type": "Uint32",
        "value": String(this.createDecimal)
      }
      ,
      {
        "vname": "init_price",
        "type": "Uint128",
        "value": String(this.createInitPrice)
      }
      ,
      {
        "vname": "interest_ratio",
        "type": "Uint128",
        "value": String(this.createInterestRatio)
      }
      ,
      {
        "vname": "burn_ratio",
        "type": "Uint128",
        "value": String(this.createBurnRatio)
      }
      ,
      {
        "vname": "expiration_block",
        "type": "BNum",
        "value": String(this.createExpirationBlock)
      }

    ];
    let code = "(* CollectiveNFT contract *)\n\n(***************************************************)\n(*                 Scilla version                  *)\n(***************************************************)\n\n(* 0.7.1 *)\nscilla_version 0\n\n(***************************************************)\n(*               Associated library                *)\n(***************************************************)\n\nimport BoolUtils PairUtils IntUtils ListUtils\nlibrary CollectiveNFT\n\nlet true = True\nlet false = False\nlet zero = Uint128 0\nlet one = Uint256 1\nlet hundred = Uint128 100\nlet one_o_one = Uint128 101\n\nlet contract_is_not_started_status = Uint32 100\nlet contract_is_active_status = Uint32 200\nlet contract_is_closed_status = Uint32 300\nlet contract_is_cancelled_status = Uint32 400\nlet contract_is_expired_status = Uint32 500\nlet contract_is_null_status = Uint32 600\n\nlet one_msg =\n  fun (msg : Message) =>\n    let nil_msg = Nil {Message} in\n    Cons {Message} msg nil_msg\n\nlet two_msgs =\nfun (msg1 : Message) =>\nfun (msg2 : Message) =>\n  let msgs_tmp = one_msg msg2 in\n  Cons {Message} msg1 msgs_tmp\n\nlet build_nft =\n  fun (nft_contract_address : ByStr20) =>\n  fun (token_id : Uint256) =>\n    Pair {ByStr20 Uint256} nft_contract_address token_id\n\nlet get_val =\n  fun (some_val: Option Uint128) =>\n  match some_val with\n  | Some val => val\n  | None => zero\n  end\n\n(* Error exception *)\ntype Error =\n  | CodeNotContractOwner\n  | CodeIsSelf\n  | CodeCannotAddNFTInThisPhase\n  | CodeCannotBuyTokenInThisPhase\n  | CodeInsufficientFunds\n  | CodeNFTDoesNotExist\n  | CodeContractHasExpired\n  | CodeCannotRemoveNFTInThisPhase\n  | CodeCannotCloseContractInThisPhase\n  | CodeNotTokenOwner\n  | CodeCannotBurnTokensInThisPhase\n  | CodeContractHasNotExpired\n\nlet make_error =\n  fun (result : Error) =>\n    let result_code =\n      match result with\n      | CodeNotContractOwner                => Int32 -1\n      | CodeIsSelf                          => Int32 -2\n      | CodeCannotAddNFTInThisPhase         => Int32 -3\n      | CodeCannotBuyTokenInThisPhase       => Int32 -4\n      | CodeInsufficientFunds               => Int32 -5\n      | CodeNFTDoesNotExist                 => Int32 -6\n      | CodeContractHasExpired              => Int32 -7\n      | CodeCannotRemoveNFTInThisPhase      => Int32 -8\n      | CodeCannotCloseContractInThisPhase  => Int32 -9\n      | CodeNotTokenOwner                   => Int32 -10\n      | CodeCannotBurnTokensInThisPhase     => Int32 -11\n      | CodeContractHasNotExpired           => Int32 -12\n      end\n    in\n    { _exception : \"Error\"; code : result_code }\n\n(***************************************************)\n(*             The contract definition             *)\n(***************************************************)\n\ncontract CollectiveNFT\n(\n  contract_owner: ByStr20,\n  name : String,\n  symbol: String,\n  decimals: Uint32,\n  init_price: Uint128,\n  interest_ratio: Uint128,\n  burn_ratio: Uint128,\n  expiration_block: BNum\n)\nwith\n  let c1 = builtin blt _creation_block expiration_block in\n  let c2 = builtin lt burn_ratio one_o_one in\n  andb c1 c2\n=>\n\n(* Mutable fields *)\n\nfield total_supply : Uint128 = zero\n\n(* Price can't be changed in this version of contract *)\nfield current_price : Uint128 = init_price\n\nfield balances: Map ByStr20 Uint128\n  = let emp_map = Emp ByStr20 Uint128 in\n    builtin put emp_map contract_owner zero\n\nfield allowances: Map ByStr20 (Map ByStr20 Uint128)\n  = Emp ByStr20 (Map ByStr20 Uint128)\n\nfield contract_status : Uint32 = contract_is_not_started_status\n\n(* Number of NFTs this contract wraps a.k.a NFT number for each NFT Pair *)\nfield nft_count: Uint256 = Uint256 0\n\n(* Mapping from NFT number to NFT Pair *)\nfield wrapped_nft: Map Uint256 Pair ByStr20 Uint256 = Emp Uint256 Pair ByStr20 Uint256\n\n(**************************************)\n(*             Procedures             *)\n(**************************************)\n\n(* Emit Errors *)\nprocedure ThrowError(err : Error)\n  e = make_error err;\n  throw e\nend\n\nprocedure CheckBlock()\n  (* don't check if contract status is already expired, cancelled, or nulled *)\n  current_status <- contract_status;\n  is_already_expired = builtin eq current_status contract_is_expired_status;\n  is_null = builtin eq current_status contract_is_null_status;\n  is_cancelled = builtin eq current_status contract_is_cancelled_status;\n  is_expired_or_null = orb is_already_expired is_null;\n  is_any = orb is_cancelled is_expired_or_null;\n  match is_any with\n    | True =>\n    | False =>\n      blk <- & BLOCKNUMBER;\n      is_expired = builtin blt expiration_block blk;\n      match is_expired with\n        | True =>\n          (* check if there is enough liquidity *)\n          current_total_supply <- total_supply;\n          price <- current_price;\n          received_zil = builtin div current_total_supply price;\n          zil_with_interest_times_hundred = builtin mul received_zil interest_ratio;\n          zil_with_interest = builtin div zil_with_interest_times_hundred hundred;\n          bal <- _balance;\n          is_liquidity_enough = uint128_le zil_with_interest bal;\n          match is_liquidity_enough with\n            | True =>\n              contract_status := contract_is_expired_status\n            | False =>\n              contract_status := contract_is_null_status\n          end\n        | False =>\n      end\n  end\nend\n\nprocedure ContractIsNotExpired()\n  CheckBlock;\n  current_status <- contract_status;\n  is_expired = builtin eq current_status contract_is_expired_status;\n  is_null = builtin eq current_status contract_is_null_status;\n  is_any = orb is_expired is_null;\n  match is_any with\n    | True =>\n      err = CodeContractHasExpired;\n      ThrowError err\n    | False =>\n  end\nend\n\nprocedure ContractIsExpiredOrNull()\n  current_status <- contract_status;\n  is_expired = builtin eq current_status contract_is_expired_status;\n  is_null = builtin eq current_status contract_is_null_status;\n  is_any = orb is_expired is_null;\n  match is_any with\n    | True =>\n    | False =>\n      err = CodeContractHasNotExpired;\n      ThrowError err\n  end\nend\n\nprocedure CanCloseContract()\n  current_status <- contract_status;\n  is_not_started = builtin eq current_status contract_is_not_started_status;\n  is_active = builtin eq current_status contract_is_active_status;\n  is_any = orb is_not_started is_active;\n  match is_any with\n    | True =>\n    | False =>\n      err = CodeCannotCloseContractInThisPhase;\n      ThrowError err\n  end\nend\n\nprocedure CanBurnTokens()\n  current_status <- contract_status;\n  is_closed = builtin eq current_status contract_is_closed_status;\n  is_active = builtin eq current_status contract_is_active_status;\n  is_any = orb is_closed is_active;\n  match is_any with\n    | True =>\n    | False =>\n      is_null = builtin eq current_status contract_is_null_status;\n      match is_null with\n        | True =>\n        | False =>\n          err = CodeCannotBurnTokensInThisPhase;\n          ThrowError err\n      end\n  end\nend\n\nprocedure CanRemoveNFTs()\n  current_status <- contract_status;\n  is_cancelled = builtin eq current_status contract_is_cancelled_status;\n  is_expired = builtin eq current_status contract_is_expired_status;\n  is_any = orb is_cancelled is_expired;\n  match is_any with\n    | True =>\n    | False =>\n      err = CodeCannotRemoveNFTInThisPhase;\n      ThrowError err\n  end\nend\n\n(*@param contractAddress - address of NFT contract*)\n(*@param tokenID - NFT token ID*)\n(*@param to - address of receiver*)\nprocedure TransferNFT (contract_address: ByStr20, token_id: Uint256, to: ByStr20)\n  transfered = {\n    _tag: \"Transfer\";\n    _recipient: contract_address;\n    _amount: Uint128 0;\n    to: to;\n    token_id: token_id\n  };\n  msgs = one_msg transfered;\n  send msgs\nend\n\nprocedure TransferZIL (to: ByStr20, amount: Uint128)\n  msg  = {_tag : \"\"; _recipient : to; _amount : amount};\n  msgs = one_msg msg;\n  send msgs\nend\n\nprocedure AuthorizedMoveIfSufficientBalance(from: ByStr20, to: ByStr20, amount: Uint128)\n  o_from_bal <- balances[from];\n  bal = get_val o_from_bal;\n  can_do = uint128_le amount bal;\n  match can_do with\n  | True =>\n    (* Subtract amount from from and add it to to address *)\n    new_from_bal = builtin sub bal amount;\n    balances[from] := new_from_bal;\n    (* Adds amount to to address *)\n    get_to_bal <- balances[to];\n    new_to_bal = match get_to_bal with\n    | Some bal => builtin add bal amount\n    | None => amount\n    end;\n    balances[to] := new_to_bal\n  | False =>\n    (* Balance not sufficient *)\n    err = CodeInsufficientFunds;\n    ThrowError err\n  end\nend\n\nprocedure IsContractOwner()\n  is_contract_owner = builtin eq contract_owner _sender;\n  match is_contract_owner with\n  | True =>\n  | False =>\n    err = CodeNotContractOwner;\n    ThrowError err\n  end\nend\n\nprocedure AcceptNFT(from : ByStr20, token_id : Uint256)\n  accept;\n  input_nft = build_nft from token_id;\n  current_nft_count <- nft_count;\n  new_nft_count = builtin add current_nft_count one;\n  nft_count := new_nft_count;\n  nft_id <- nft_count;\n  wrapped_nft[nft_id] := input_nft\nend\n\n(***************************************)\n(*             Transitions             *)\n(***************************************)\n\n(* Tokens are sold only when contract is active *)\n(*{status == active}*)\ntransition BuyTokens()\n  ContractIsNotExpired;\n  current_status <- contract_status;\n  is_active = builtin eq current_status contract_is_active_status;\n  match is_active with\n    | True =>\n      accept;\n      price <- current_price;\n      add_bal = builtin mul _amount price;\n      o_from_bal <- balances[_sender];\n      bal = get_val o_from_bal;\n      new_bal = builtin add bal add_bal;\n      balances[_sender] := new_bal;\n      current_total_supply <- total_supply;\n      new_total_supply = builtin add current_total_supply add_bal;\n      total_supply := new_total_supply\n    | False =>\n      err = CodeCannotBuyTokenInThisPhase;\n      ThrowError err\n  end\nend\n\n(* @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. *)\n(* @dev: Balance of recipient will increase. Balance of _sender will decrease.      *)\n(* @param to:  Address of the recipient whose balance is increased.                 *)\n(* @param amount:     Amount of tokens to be sent.                                  *)\ntransition TransferTokens(to: ByStr20, amount: Uint128)\n  CheckBlock;\n  AuthorizedMoveIfSufficientBalance _sender to amount;\n  e = {_eventname : \"TransferSuccess\"; sender : _sender; recipient : to; amount : amount};\n  event e;\n  (* Prevent sending to a contract address that does not support transfers of token *)\n  msg_to_recipient = {_tag : \"RecipientAcceptTransfer\"; _recipient : to; _amount : zero;\n                      sender : _sender; recipient : to; amount : amount};\n  msg_to_sender = {_tag : \"TransferSuccessCallBack\"; _recipient : _sender; _amount : zero;\n                  sender : _sender; recipient : to; amount : amount};\n  msgs = two_msgs msg_to_recipient msg_to_sender;\n  send msgs\nend\n\n(* Token owners can burn their tokens before the end of the contract period *)\n(*{status == active, closed, null}*)\ntransition BurnTokens(amount: Uint128)\n  CheckBlock;\n  CanBurnTokens;\n  is_amount_zero = builtin eq amount zero;\n  o_from_bal <- balances[_sender];\n  bal = get_val o_from_bal;\n  is_balance_zero = builtin eq bal zero;\n  dont_continue = orb is_amount_zero is_balance_zero;\n  match dont_continue with\n    | False =>\n      can_do = uint128_le amount bal;\n      match can_do with\n        | False =>\n          (* Burn it all! *)\n          balances[_sender] := zero;\n          current_total_supply <- total_supply;\n          new_total_supply = builtin sub current_total_supply bal;\n          total_supply := new_total_supply;\n          price <- current_price;\n          original_zil_equivalent = builtin div bal price;\n          zil_to_refund_times_hundred = builtin mul original_zil_equivalent burn_ratio;\n          zil_to_refund = builtin div zil_to_refund_times_hundred hundred;\n          TransferZIL _sender zil_to_refund\n        | True =>\n          new_bal = builtin sub bal amount;\n          balances[_sender] := new_bal;\n          current_total_supply <- total_supply;\n          new_total_supply = builtin sub current_total_supply amount;\n          total_supply := new_total_supply;\n          price <- current_price;\n          original_zil_equivalent = builtin div amount price;\n          zil_to_refund_times_hundred = builtin mul original_zil_equivalent burn_ratio;\n          zil_to_refund = builtin div zil_to_refund_times_hundred hundred;\n          TransferZIL _sender zil_to_refund\n      end\n    | True =>\n      err = CodeInsufficientFunds;\n      ThrowError err\n  end\nend\n\n(* Owner can cancel contract only when there is no token in circulation *)\n(*{status == not_started, active, closed}*)\ntransition CancelContract()\n  ContractIsNotExpired;\n  IsContractOwner;\n  current_total_supply <- total_supply;\n  is_zero = builtin eq current_total_supply zero;\n  match is_zero with\n    | True =>\n      contract_status := contract_is_cancelled_status\n    | False =>\n  end\nend\n\n(*{status == not_started, active}*)\ntransition CloseContract()\n  ContractIsNotExpired;\n  CanCloseContract;\n  IsContractOwner;\n  contract_status := contract_is_closed_status\nend\n\n(*{status == not_started, active, closed}*)\ntransition AddFunds()\n  ContractIsNotExpired;\n  accept\nend\n\n(*{status != expired, null}*)\ntransition MoveFunds(to: ByStr20, amount: Uint128)\n  ContractIsNotExpired;\n  IsContractOwner;\n  TransferZIL to amount\nend\n\n(*{status == expired, null}*)\ntransition ClaimFunds()\n  CheckBlock;\n  ContractIsExpiredOrNull;\n  o_from_bal <- balances[_sender];\n  bal = get_val o_from_bal;\n  is_balance_zero = builtin eq bal zero;\n  match is_balance_zero with\n    | True =>\n      err = CodeNotTokenOwner;\n      ThrowError err\n    | False =>\n      (* Calculate interest *)\n      price <- current_price;\n      amount = builtin div bal price;\n      interest_mul = builtin add interest_ratio hundred;\n      with_interest_times_hundred = builtin mul amount interest_mul;\n      with_interest = builtin div with_interest_times_hundred hundred;\n      balances[_sender] := zero;\n      current_total_supply <- total_supply;\n      new_total_supply = builtin sub current_total_supply bal;\n      total_supply := new_total_supply;\n      TransferZIL _sender with_interest\n  end\nend\n\n(* Owner can send away NFTs when contract is cancelled or expired with interests paid *)\n(*{status == expired, cancelled}*)\ntransition RemoveNFT(to: ByStr20, nft_num: Uint256)\n  CheckBlock;\n  CanRemoveNFTs;\n  nft_exists <- exists wrapped_nft[nft_num];\n  match nft_exists with\n    | True =>\n      nft_option <- wrapped_nft[nft_num];\n      match nft_option with\n        | Some val =>\n          nft = val;\n          get_nft_contract = @fst ByStr20 Uint256;\n          nft_contract = get_nft_contract nft;\n          get_token_id = @snd ByStr20 Uint256;\n          token_id = get_token_id nft;\n          TransferNFT nft_contract token_id to;\n          delete wrapped_nft[nft_num];\n          current_nft_count <- nft_count;\n          new_nft_count = builtin sub current_nft_count one;\n          nft_count := new_nft_count\n        | None =>\n      end\n    | False =>\n      err = CodeNFTDoesNotExist;\n      ThrowError err\n  end\nend\n\ntransition UpdateStatus()\n  CheckBlock\nend\n\ntransition RecipientAcceptTransfer\n(from : ByStr20, recipient : ByStr20, token_id : Uint256)\n  ContractIsNotExpired;\n  current_status <- contract_status;\n  is_not_started = builtin eq current_status contract_is_not_started_status;\n  match is_not_started with\n    | True =>\n      AcceptNFT _sender token_id;\n      contract_status := contract_is_active_status\n    | False =>\n      is_active = builtin eq current_status contract_is_active_status;\n      match is_active with\n        | True =>\n          AcceptNFT _sender token_id\n        | False =>\n          err = CodeCannotAddNFTInThisPhase;\n          ThrowError err\n      end\n  end\nend\n\ntransition RecipientAcceptTransferFrom\n(from : ByStr20, recipient : ByStr20, token_id : Uint256)\n  ContractIsNotExpired;\n  current_status <- contract_status;\n  is_not_started = builtin eq current_status contract_is_not_started_status;\n  match is_not_started with\n    | True =>\n      AcceptNFT _sender token_id;\n      contract_status := contract_is_active_status\n    | False =>\n      is_active = builtin eq current_status contract_is_active_status;\n      match is_active with\n        | True =>\n          AcceptNFT _sender token_id\n        | False =>\n          err = CodeCannotAddNFTInThisPhase;\n          ThrowError err\n      end\n  end\nend\n\ntransition TransferSuccessCallBack\n(from : ByStr20, recipient : ByStr20, token_id : Uint256)\nend\n\n\n";
    const contract = zilliqa.contracts.new(code, init);
    const myGasPrice = units.toQa('1000', units.Units.Li);
    const tx=await contract.deploy({
      gasPrice: myGasPrice,
      gasLimit: Long.fromNumber(this.txGasLimit)
    }).then((data: any) => {
      this.showCreateDetails = false;
      this.showCreateRes = true;
      this.creatResAdd = data[1].address;
      this.creatResGasPrice = String(data[0].txParams.gasPrice / Math.pow(10, 12)) + ' zil'
      this.createTnxID = data[0].TranID
      let dt=data[0].error()
    }, (data: any) => {
      console.log("failed", data)
      this.showCreateError = true;
      this.createErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    });
  }

  createExpirationDateChange() {
    if (!window.zilPay.wallet.isConnect) {
      this.connectWallet();
    }
    let now = new Date();
    now.setTime(now.getTime() + now.getTimezoneOffset() * 60 * 1000);
    let toDate = new Date(this.createExpirationYear, this.createExpirationMonth - 1, this.createExpirationDay, 0, 0, 0);
    toDate.setTime(toDate.getTime());
    this.createExpirationBlock = Math.floor((toDate.getTime() - now.getTime()) / 1000 / 60);
    this.createExpirationBlock = (Number(this.latestBlockNo) + Number(this.createExpirationBlock));
  }

  createTokenPriceChange() {
    this.tokenPriceConvert()
  }

  async buyToken() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long, toChecksumAddress} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    let amount = Number(this.buyAmount) * Math.pow(10, this.checkDecimal);
    const trns = await contract.call(
      'BuyTokens',
      [],
      {
        amount,
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.buyInfo = tx.Info
      this.buyTranID = tx.TranID
      this.buyGas = Number(tx.txParams.gasPrice) / Math.pow(10, 12);
      this.buyAmount = amount / Math.pow(10, this.checkDecimal);
      this.showBuyForm = false;
      this.showBuyRes = true;
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    })
  }

  async transferToken() {
    const init = [
      {
        "vname": "to",
        "type": "ByStr20",
        "value": this.transferToAddress
      },
      {
        "vname": "amount",
        "type": "Uint128",
        "value": this.transferAmount * Math.pow(10, this.checkDecimal)
      }]
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long, toChecksumAddress} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'TransferTokens',
      init,
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.transferInfo = tx.Info
      this.transferTranID = tx.TranID
      this.transferGas = Number(tx.txParams.gasPrice) / Math.pow(10, 12);
      this.transferAmount = this.transferAmount * Math.pow(10, this.checkDecimal)
      this.showTransferForm = false;
      this.showTransferRes = true;
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    })
  }

  buyAmountChange(amount: number) {
    if (amount != null) {
      this.buyZilPrice = (((Number(amount) * Math.pow(10, this.checkDecimal)) / this.checkInitPrice) / Math.pow(10, 12));
    } else this.buyZilPrice = 0
  }

  async burnToken() {
    const init = [
      {
        "vname": "amount",
        "type": "Uint128",
        "value": this.burnAmount * Math.pow(10, this.checkDecimal)
      }]
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'BurnTokens',
      init,
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.burnInfo = tx.Info
      this.burnTranID = tx.TranID
      this.burnGas = Number(tx.txParams.gasPrice) / Math.pow(10, 12);
      this.burnAmount = this.burnAmount * Math.pow(10, this.checkDecimal)
      this.showBurnForm = false;
      this.showBurnRes = true;
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    })
  }

  async addFund() {
    const init = [
      {
        "vname": "amount",
        "type": "Uint128",
        "value": this.addFundAmount * Math.pow(10, 12)
      }]
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'AddFunds',
      init,
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.addFundInfo = tx.Info
      this.addFundTranID = tx.TranID
      this.addFundGas = Number(tx.txParams.gasPrice) / Math.pow(10, 12);
      this.addFundAmount = this.addFundAmount * Math.pow(10, 12)
      this.showAddFundForm = false;
      this.showAddFundRes = true;
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    })
  }

  async claimFund() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'ClaimFunds',
      [],
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.showClaimFundForm = false;
      this.showClaimFundRes = true;
      this.claimFundTranID = tx.TranID
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    })
  }

  async closeContract() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'CloseContract',
      [],
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.closeResMessage = 'You just closed the contract. Nobody can buy (mint)'
      this.showCloseForm = false;
      this.showCloseRes = true;
      this.closeTranID = tx.TranID
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    });
  }

  async cancelContract() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'CancelContract',
      [],
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.cancelResMessage = 'You just cancelled the contract. You can now unlock your NFTs'
      this.showCancelForm = false;
      this.showCancelRes = true;
      this.cancelTranID = tx.TranID
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    });
  }

  async unlockContract() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const init = [
      {
        "vname": "to",
        "type": "ByStr20",
        "value": this.unlockToAdd
      }, {
        "vname": "nft_num",
        "type": "Uint256",
        "value": this.unlockNFTID
      }]
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'RemoveNFT',
      init,
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.showUnlockForm = false;
      this.showUnlockRes = true;
      this.unlockTranID = tx.TranID
      this.unlockResMessage = 'You just moved NFT ', this.unlockNFTID, ' to ', this.unlockToAdd
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    });
  }

  async move() {
    let contract = window.zilPay.contracts.at(this.contractAdd);
    const init = [
      {
        "vname": "to",
        "type": "ByStr20",
        "value": this.moveToAdd
      }, {
        "vname": "amount",
        "type": "Uint128",
        "value": this.moveAmount
      }]
    const {units, Long} = window.zilPay.utils;
    let myGasPrice = units.toQa('1000', units.Units.Li);
    await contract.call(
      'MoveFunds',
      [],
      {
        myGasPrice,
        gasLimit: Long.fromNumber(this.txGasLimit)
      },
      true
    ).then((tx: any) => {
      this.showUnlockForm = false;
      this.showUnlockRes = true;
      this.moveTranID = tx.TranID
      this.unlockResMessage = 'You just moved NFT ', this.unlockNFTID, ' to ', this.unlockToAdd
    }, (data: any) => {
      this.showCheckError = true;
      this.checkErrorMessage = data.message;
      interval(8000).subscribe((func => {
        this.wipeErrors()
      }))
    });
  }


}
