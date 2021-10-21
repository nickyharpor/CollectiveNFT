from pyzil.zilliqa import chain
from pyzil.account import Account
from pyzil.contract import Contract
from pyzil.zilliqa.units import Zil, Qa
from pyzil.zilliqa.api import ZilliqaAPI, APIError

from telethon import TelegramClient, events, Button
from telethon.errors import TimeoutError

import re

from conf import Conf

api = ZilliqaAPI("https://dev-api.zilliqa.com/")

chain.set_active_chain(chain.TestNet)

bot = TelegramClient('bot', Conf.api_id, Conf.api_hash).start(bot_token=Conf.bot_token)

errors = {
    -1: 'you\'re not the contract owner.',
    -2: 'of a fatal error.',
    -3: 'you can\'t add NFTs to the contract in this phase.',
    -4: 'you can\'t buy tokens in this phase.',
    -5: 'this isn\'t affordable.',
    -6: 'this NFT doesn\'t exist.',
    -7: 'contract has expired.',
    -8: 'you can\'t remove NFTs in this phase.',
    -9: 'you can\'t close the contract in this phase.',
    -10: 'you\'re not a token owner.',
    -11: 'you can\'t burn tokens in this phase.',
    -12: 'contract hasn\'t expired yet.'
}


@bot.on(events.NewMessage(pattern='/start'))
async def start(event):
    # FOR FUTURE: store str(event.peer_id.user_id) and str(event.chat_id) somewhere
    await functions(event)


@bot.on(events.NewMessage(pattern='/show'))
async def show(event):
    await functions(event, msg='💁🏼 What do you want to do?')


@bot.on(events.CallbackQuery(data=b'new'))
async def b_new(event):
    try:
        async with bot.conversation(event.query.user_id, timeout=1000) as conv:
            tx_block_info = api.GetLatestTxBlock()
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('ℹ️ By creating a new contract, you can lock up your NFTs as collateral and get loans. '
                                    'Each contract expires at a specified block number. Make sure the contract has enough '
                                    'Zil liquidity to pay back everyone with interest, otherwise you\'ll lose your NFTs.'
                                    '\n\n⚠️ Note that current block number is **'
                                    + str(tx_block_info['header']['BlockNum']) +
                                    '** and each block takes about 45 seconds to 4 minutes to be mined.\n\n'
                                    '💁🏼 What block number do you want to mark as expiration block? (Enter a number)')
            block_number_msg = await handle
            try:
                expiration_block = int(block_number_msg.text)
            except:
                await conv.send_message('🤦🏼 This can\'t be a block number! Please start again.')
                return
            if expiration_block <= int(tx_block_info['header']['BlockNum']):
                await conv.send_message('😑 This block has already been mined. Enter a block number in future!')
                return
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('🏦 How much interest will you pay to the lenders? The number you enter will be '
                                    'used as the interest rate, so 10 means 10% interest. (Enter a number)')
            interest_rate_msg = await handle
            try:
                interest_rate = int(interest_rate_msg.text)
            except:
                await conv.send_message('🤦🏼 This can\'t be interest rate! Please start over.')
                return
            if interest_rate < 0:
                await conv.send_message('😑 Interest rate must be equal to or greater than zero! Please start over.')
                return
            elif interest_rate > 100:
                await conv.send_message('❌ Warning: The interest rate you specified seems to be too high!')
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('🚯 Lenders can take back their loan before the expiration of the contract (if you '
                                    'let them), but they are penalized with a percentage of it which is called burn rate. '
                                    'Burn rate of 70 means you pay back 70% of lenders loan back, and keep 30% as penalty.'
                                    '\n\n💁🏼 What\'s the burn rate of your contract? (Enter a number [0-100])')
            burn_rate_msg = await handle
            try:
                burn_rate = int(burn_rate_msg.text)
            except:
                await conv.send_message('🤦🏼 This can\'t be burn rate! Please start over.')
                return
            if burn_rate < 0:
                await conv.send_message('😑 Burn rate must be equal to or greater than zero! Please start over.')
                return
            elif burn_rate > 100:
                await conv.send_message('😑 Burn rate must be equal to or less than 100! Please start over.')
                return
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('📝 In order to keep records, the contract mint fungible tokens for '
                                    'lenders corresponding to the loan amount.\n\n'
                                    '💁🏼 What do you want to call your token?')
            token_name_msg = await handle
            token_name = token_name_msg.text.strip()
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('💲 Every token has a symbol. What\'s the symbol of your token?')
            token_symbol_msg = await handle
            token_symbol = token_symbol_msg.text.strip()
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('💵 How much does your token cost in Zil? \n\n'
                                    '🔹 Examples: \n'
                                    'If you enter **2**, then \n'
                                    '**1 ' + token_symbol + ' = 2 Zil** \n'
                                    'If you enter **0.05** then \n'
                                    '**1 ' + token_symbol + ' = 0.05 Zil** \n')
            token_price_msg = await handle
            token_price = token_price_msg.text.strip()
            try:
                float_price = float(token_price)
                if float_price < 0.000000000001:
                    raise events.StopPropagation
                init_price = 1/float_price
                decimal = 12
                while int(init_price) != init_price:
                    init_price *= 10
                    decimal += 1
                while int(init_price) % 10 == 0:
                    init_price /= 10
                    decimal -= 1
            except:
                await conv.send_message('🤦🏼 It can\'t cost ' + token_price + ' Zil! Please start over.')
            handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
            await conv.send_message('🔐 Please enter your private key to deploy the contract:\n\n'
                                    '🧏🏼 Private key is used only for this transaction and is NOT logged or stored. '
                                    'Don\'t believe it? Learn [how to make your own bot]'
                                    '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                    link_preview=False)
            private_key_msg = await handle
            private_key = private_key_msg.text.strip()
            account = Account(private_key=private_key)
            contract_code = get_contract_as_str()
            contract = Contract.new_from_code(contract_code)
            contract.account = account
            init = [
                Contract.value_dict("_scilla_version", "Uint32", "0"),
                Contract.value_dict("contract_owner", "ByStr20", account.address0x),
                Contract.value_dict("name", "String", token_name),
                Contract.value_dict("symbol", "String", token_symbol),
                Contract.value_dict("decimals", "Uint32", str(decimal)),
                Contract.value_dict("init_price", "Uint128", str(int(init_price))),
                Contract.value_dict("interest_ratio", "Uint128", str(interest_rate)),
                Contract.value_dict("burn_ratio", "Uint128", str(burn_rate)),
                Contract.value_dict("expiration_block", "BNum", str(expiration_block))
            ]
            await conv.send_message('⏳ Please wait...')
            resp = contract.deploy(init_params=init, gas_limit=20000)
            if contract.status == Contract.Status.Deployed:
                await conv.send_message('✅ Contract\'s been deployed successfully.\n\n'
                                        '🔖 Contract address (base16 format): ' + '0x' + contract.address + '\n\n'
                                        '🔖 Contract address (bech32 format): ' + to_bech32(contract.address) + '\n\n'
                                        + '📭 Send at least one NFT to the contract address to activate it.')
            else:
                await conv.send_message('⛔️ Contract deployment failed. Maybe you couldn\'t afford the gas fee.')
    except TimeoutError:
        await bot.send_message(event.chat_id, '💤 It\'s taking too long! Please start over.')
    except:
        await bot.send_message(event.chat_id, '🤷🏼 Something went wrong. Please start over.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'status'))
async def b_status(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'name'):
                        token_name = init['value']
                    elif (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                    elif (init['vname'] == 'contract_owner'):
                        token_owner = init['value']
                    elif (init['vname'] == 'decimals'):
                        token_decimals = int(init['value'])
                    elif (init['vname'] == 'interest_ratio'):
                        interest_ratio = int(init['value'])
                    elif (init['vname'] == 'burn_ratio'):
                        burn_ratio = int(init['value'])
                    elif (init['vname'] == 'expiration_block'):
                        expiration_block = int(init['value'])
                    elif (init['vname'] == '_creation_block'):
                        creation_block = int(init['value'])
                current_price = int(contract.state['current_price'])
                zil = Zil((10**token_decimals / current_price) / (10**12))
                token_supply = int(contract.state['total_supply'])/(10**token_decimals)
                required_supply = (token_supply * zil) + ((token_supply * zil)*interest_ratio)/100
                contract_status_raw = contract.state['contract_status']
                if contract_status_raw == '100':
                    contract_status = '⭕️ Not Started (no NFT locked)'
                    required_supply = ''
                elif contract_status_raw == '200':
                    contract_status = '🟢 Active (you can buy tokens)'
                    required_supply = '(' + str(required_supply) + ' required)'
                elif contract_status_raw == '300':
                    contract_status = '🟡 Closed (waiting for expiration)'
                    required_supply = '(' + str(required_supply) + ' required)'
                elif contract_status_raw == '400':
                    contract_status = '🚫 Cancelled (by owner)'
                    required_supply = ''
                elif contract_status_raw == '500':
                    contract_status = '⌛️ Expired (interest paid)'
                    required_supply = ''
                else:
                    contract_status = '☠️ Null and Void (owner lost locked-up NFTs)'
                    required_supply = ''
                tx_block_info = api.GetLatestTxBlock()
                block_left = expiration_block - int(tx_block_info['header']['BlockNum'])
                if block_left <= 0:
                    if contract_status_raw != '400' and contract_status_raw != '500' and contract_status_raw != '600':
                        contract_status = '❔ Unknown (update status to find out)'
                    block_left = 'Passed'
                elif block_left == 1:
                    block_left = 'Only one block left'
                else:
                    block_left = str(block_left) + ' blocks left'
                s = "Contract status: {contract_status}\n" \
                    "Contract owner: {token_owner}\n" \
                    "Token name: {token_name}\n" \
                    "Token symbol: {token_symbol}\n" \
                    "Token price: {zil}\n" \
                    "Interest ratio: {interest_ratio}%\n" \
                    "Burn ratio: {burn_ratio}%\n" \
                    "Expiration block: #{expiration_block} ({block_left})\n" \
                    "Creation block: #{creation_block}\n" \
                    "NFT count: {nft_count:,}\n" \
                    "Total token supply: {total_supply:,} {token_symbol}\n" \
                    "Zil liquidity: {zil_liquidity:,} Zil {required_supply}".format(
                    contract_status = contract_status,
                    token_name = token_name,
                    token_symbol = token_symbol,
                    token_owner = token_owner,
                    zil = repr(zil),
                    interest_ratio = interest_ratio,
                    burn_ratio = burn_ratio,
                    expiration_block = expiration_block,
                    block_left = block_left,
                    creation_block = creation_block,
                    nft_count = int(contract.state['nft_count']),
                    total_supply = token_supply,
                    zil_liquidity = int(contract.state['_balance'])/(10**12),
                    required_supply=required_supply)
                await conv.send_message(s)
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'list'))
async def b_list(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                s = '📎 Locked-up NFT list:\n\n'
                nft_dic = contract.state['wrapped_nft']
                for key, value in nft_dic.items():
                    s = s + '**#' + key + '** 👉 Token contract: ' + value['arguments'][0] \
                        + ' | Token ID: ' + value['arguments'][1] + '\n\n'
                await conv.send_message(s)
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'balance'))
async def b_balance(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                    elif (init['vname'] == 'decimals'):
                        token_decimals = int(init['value'])
                balances_dic = contract.state['balances']
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 Contract\'s been loaded. Please enter your address:')
                user_address_msg = await handle
                user_address = to_base16(user_address_msg.text.strip())
                if is_base16_address(user_address):
                    try:
                        if user_address.lower() in balances_dic:
                            user_balance = int(balances_dic[user_address.lower()])/(10**token_decimals)
                            show_balance = f'{user_balance:,}'
                            await conv.send_message('🤑 You have ' + show_balance + ' ' + token_symbol + '.')
                        else:
                            await conv.send_message('👻 You don\'t own any ' + token_symbol + '.')
                    except:
                        await conv.send_message('🤷🏼 Error while checking your balance. Please try again later.')
                else:
                    await conv.send_message('❌ It doesn\'t seem to be a valid address.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'buy'))
async def b_buy(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                current_price = int(contract.state['current_price'])
                for init in init_list:
                    if (init['vname'] == 'decimals'):
                        token_decimals = int(init['value'])
                    elif (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 How many ' + token_symbol + ' do you want to buy? (Enter a number)')
                token_amount_msg = await handle
                try:
                    token_amount = float(token_amount_msg.text.strip())
                    qa = Qa((token_amount * (10**token_decimals)) / current_price)
                    zil = Zil(((token_amount * (10**token_decimals)) / current_price) / (10**12))
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('💰 You\'re about to buy ' + str(token_amount) + ' ' + token_symbol
                                            + ' for ' + repr(zil) + '.\n\n'
                                            '🔐 Please enter your private key:\n\n'
                                            '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                            ' Don\'t believe it? Learn [how to make your own bot]'
                                            '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                            link_preview=False)
                    private_key_msg = await handle
                    try:
                        private_key = private_key_msg.text.strip()
                        account = Account(private_key=private_key)
                        balance = account.get_balance()
                        if balance < zil:
                            await conv.send_message('💩 You can\'t afford ' + repr(zil)
                                                    + '. You only have ' + str(balance) + ' Zil.')
                            return
                        contract.account = account
                        await conv.send_message('⏳ Please wait...')
                        resp = contract.call(method="BuyTokens", params=[], amount=qa)
                        if contract.last_receipt['success']:
                            s = '✅ You just bought ' + str(token_amount) + ' ' + token_symbol \
                            + ' for ' + repr(zil) + '. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                            + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                        else:
                            error_str = str(contract.last_receipt['exceptions'])
                            error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                        .strip(')'))
                            s = '🤷🏼 Purchase failed because ' + errors[error]
                        await conv.send_message(s)
                    except:
                        await conv.send_message('🤷🏼 Purchase failed. Private key\'s probably incorrect. '
                                                'Please start again.')
                except:
                    await conv.send_message('🤷🏼 You can\'t buy ' + token_amount_msg.text.strip()
                                            + ' ' + token_symbol + '. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'transfer'))
async def b_transfer(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'decimals'):
                        token_decimals = int(init['value'])
                    elif (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 How many ' + token_symbol + ' do you want to transfer? (Enter a number)')
                token_amount_msg = await handle
                try:
                    token_amount = float(token_amount_msg.text.strip())
                    token_str = f'{token_amount:,}'
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('💁🏼 Who do you want to transfer to? (Enter an address)')
                    to_msg = await handle
                    to = to_base16(to_msg.text.strip())
                    if is_base16_address(to):
                        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                        await conv.send_message('📤 You\'re about to transfer ' + token_str + ' ' + token_symbol
                                                + ' to ' + to + '.\n\n🔐 Please enter your private key:\n\n'
                                                '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                                ' Don\'t believe it? Learn [how to make your own bot]'
                                                '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                                link_preview=False)
                        private_key_msg = await handle
                        try:
                            private_key = private_key_msg.text.strip()
                            account = Account(private_key=private_key)
                            contract.account = account
                            int_amount = int(token_amount * (10**token_decimals))
                            await conv.send_message('⏳ Please wait...')
                            resp = contract.call(method="TransferTokens", params=[
                                Contract.value_dict('to', 'ByStr20', to),
                                Contract.value_dict('amount', 'Uint128', str(int_amount))
                            ])
                            if contract.last_receipt['success']:
                                s = '✅ You just transferred ' + token_str + ' ' + token_symbol \
                                    + ' to ' + to + '. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                                    + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                            else:
                                error_str = str(contract.last_receipt['exceptions'])
                                error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                            .strip(')'))
                                s = '🤷🏼 Transfer failed because ' + errors[error]
                            await conv.send_message(s)
                        except:
                            await conv.send_message('🤷🏼 Transfer failed. Private key\'s probably incorrect. '
                                                    'Please start again.')
                    else:
                        await conv.send_message('❌ It doesn\'t seem to be a valid address. Please start again.')
                except:
                    await conv.send_message('🤷🏼 You can\'t transfer ' + token_amount_msg.text.strip()
                                            + ' ' + token_symbol + '. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'burn'))
async def b_burn(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'decimals'):
                        token_decimals = int(init['value'])
                    elif (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                    elif (init['vname'] == 'burn_ratio'):
                        burn_ratio = int(init['value'])
                current_price = int(contract.state['current_price'])
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 How many ' + token_symbol + ' do you want to burn? (Enter a number)')
                token_amount_msg = await handle
                try:
                    token_amount = float(token_amount_msg.text.strip())
                    zil = Zil(((token_amount * (10**token_decimals)) / current_price) / (10**12))
                    refund = (zil * burn_ratio) / 100
                    refund_str = f'{refund:,}'
                    token_str = f'{token_amount:,}'
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('🚮 You\'re about to burn ' + token_str + ' ' + token_symbol
                                            + ' for ' + refund_str + ' Zil.\n\n🔐 Please enter your private key:\n\n'
                                            '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                            ' Don\'t believe it? Learn [how to make your own bot]'
                                            '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                            link_preview=False)
                    private_key_msg = await handle
                    private_key = private_key_msg.text.strip()
                    account = Account(private_key=private_key)
                    contract.account = account
                    await conv.send_message('⏳ Please wait...')
                    resp = contract.call(method="BurnTokens", params=[
                        Contract.value_dict('amount', 'Uint128', str(int(token_amount * (10**token_decimals))))
                    ])
                    if contract.last_receipt['success']:
                        s = '✅ You just burned ' + token_str + ' ' + token_symbol + ' for '\
                            + refund_str + ' Zil. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                            + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                    else:
                        error_str = str(contract.last_receipt['exceptions'])
                        error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                    .strip(')'))
                        s = '🤷🏼 Burning failed because ' + errors[error]
                    await conv.send_message(s)
                except:
                    await conv.send_message('🤷🏼 You can\'t burn ' + token_amount_msg.text.strip()
                                            + ' ' + token_symbol + '. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'cancel'))
async def b_cancel(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                total_supply = int(contract.state['total_supply'])
                if total_supply > 0:
                    await conv.send_message('This contract can\'t be cancelled since there are some tokens '
                                            'in circulation.')
                    return
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('🗑 You\'re about to cancel the contract.\n\n🔐 Please enter your private key:\n\n'
                                        '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                        ' Don\'t believe it? Learn [how to make your own bot]'
                                        '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                        link_preview=False)
                private_key_msg = await handle
                try:
                    private_key = private_key_msg.text.strip()
                    account = Account(private_key=private_key)
                    contract.account = account
                    await conv.send_message('⏳ Please wait...')
                    resp = contract.call(method="CancelContract", params=[])
                    if contract.last_receipt['success']:
                        s = '✅ You just cancelled the contract. You can now unlock your NFTs. Transaction used ' \
                            + contract.last_receipt['cumulative_gas'] + ' gas and is stored on block #' \
                            + contract.last_receipt['epoch_num'] + '.'
                    else:
                        error_str = str(contract.last_receipt['exceptions'])
                        error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                    .strip(')'))
                        s = '🤷🏼 Cancellation failed because ' + errors[error]
                    await conv.send_message(s)
                except:
                    await conv.send_message('🤷🏼 Cancellation failed. Private key\'s probably incorrect. '
                                            'Please start over.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'close'))
async def b_close(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'symbol'):
                        token_symbol = init['value']
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('🚧 You\'re about to close the contract.\n\n🔐 Please enter your private key:\n\n'
                                        '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                        ' Don\'t believe it? Learn [how to make your own bot]'
                                        '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                        link_preview=False)
                private_key_msg = await handle
                try:
                    private_key = private_key_msg.text.strip()
                    account = Account(private_key=private_key)
                    contract.account = account
                    await conv.send_message('⏳ Please wait...')
                    resp = contract.call(method="CloseContract", params=[])
                    if contract.last_receipt['success']:
                        s = '✅ You just closed the contract. Nobody can buy (mint) ' + token_symbol \
                            + ' anymore. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                            + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                    else:
                        error_str = str(contract.last_receipt['exceptions'])
                        error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                    .strip(')'))
                        s = '🤷🏼 Closure failed because ' + errors[error]
                    await conv.send_message(s)
                except:
                    await conv.send_message('🤷🏼 Closure failed. Private key\'s probably incorrect. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'add'))
async def b_add(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 How many Zils do you want to add to the contract? (Enter a number)')
                zil_amount_msg = await handle
                try:
                    zil_amount = float(zil_amount_msg.text.strip())
                    zil = Zil(zil_amount)
                    qa = Qa(zil_amount * (10**12))
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('➕ You\'re about to add ' + repr(zil) + ' to the contract.'
                                            '\n\n🔐 Please enter your private key:\n\n'
                                            '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                            ' Don\'t believe it? Learn [how to make your own bot]'
                                            '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                            link_preview=False)
                    private_key_msg = await handle
                    try:
                        private_key = private_key_msg.text.strip()
                        account = Account(private_key=private_key)
                        balance = account.get_balance()
                        if balance < zil:
                            await conv.send_message('💩 You can\'t afford this. You only have ' + str(balance) + ' Zil.')
                            return
                        contract.account = account
                        await conv.send_message('⏳ Please wait...')
                        resp = contract.call(method="AddFunds", params=[], amount=qa)
                        if contract.last_receipt['success']:
                            s = '✅ You just added ' + repr(zil) + ' to the contract. Transaction used ' \
                                + contract.last_receipt['cumulative_gas'] + ' gas and is stored on block #' \
                                + contract.last_receipt['epoch_num'] + '.'
                        else:
                            error_str = str(contract.last_receipt['exceptions'])
                            error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                        .strip(')'))
                            s = '🤷🏼 Adding funds failed because ' + errors[error]
                        await conv.send_message(s)
                    except:
                        await conv.send_message('🤷🏼 Adding funds failed. Private key\'s probably incorrect. '
                                                'Please start again.')
                except:
                    await conv.send_message('🤷🏼 You can\'t add funds. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'move'))
async def b_move(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 How many Zils do you want to move? (Enter a number)')
                zil_amount_msg = await handle
                try:
                    zil_amount = float(zil_amount_msg.text.strip())
                    zil_str = f'{zil_amount:,}'
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('💁🏼 What address do you want to move funds to?')
                    to_msg = await handle
                    to = to_base16(to_msg.text.strip())
                    if is_base16_address(to):
                        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                        await conv.send_message('➖ You\'re about to move ' + zil_str + ' Zil to ' + to
                                                + '.\n\n🔐 Please enter your private key:\n\n'
                                                  '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                                  ' Don\'t believe it? Learn [how to make your own bot]'
                                                  '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                                link_preview=False)
                        private_key_msg = await handle
                        try:
                            private_key = private_key_msg.text.strip()
                            account = Account(private_key=private_key)
                            contract.account = account
                            await conv.send_message('⏳ Please wait...')
                            resp = contract.call(method="MoveFunds", params=[
                                Contract.value_dict('to', 'ByStr20', to),
                                Contract.value_dict('amount', 'Uint128', str(int(zil_amount*(10**12))))
                            ])
                            if contract.last_receipt['success']:
                                s = '✅ You just moved ' + zil_str + ' Zil to ' + to \
                                    + '. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                                    + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                            else:
                                error_str = str(contract.last_receipt['exceptions'])
                                error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                            .strip(')'))
                                s = '🤷🏼 Moving funds failed because ' + errors[error]
                            await conv.send_message(s)
                        except:
                            await conv.send_message('🤷🏼 Moving funds failed. Private key\'s probably incorrect. '
                                                    'Please start again.')
                    else:
                        await conv.send_message('❌ It doesn\'t seem to be a valid address. Please start again.')
                except:
                    await conv.send_message('🤷🏼 You can\'t move funds. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'claim'))
async def b_claim(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('📥 You\'re about to claim your funds with interest. '
                                        '\n\n🔐 Please enter your private key:\n\n'
                                        '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                        ' Don\'t believe it? Learn [how to make your own bot]'
                                        '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                        link_preview=False)
                private_key_msg = await handle
                try:
                    private_key = private_key_msg.text.strip()
                    account = Account(private_key=private_key)
                    contract.account = account
                    await conv.send_message('⏳ Please wait...')
                    resp = contract.call(method="ClaimFunds", params=[])
                    if contract.last_receipt['success']:
                        s = '✅ You just claimed your funds with interest. You can find them in your account.' \
                            ' Transaction used ' + contract.last_receipt['cumulative_gas'] \
                            + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                    else:
                        error_str = str(contract.last_receipt['exceptions'])
                        error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                    .strip(')'))
                        s = '🤷🏼 Claiming funds failed because ' + errors[error]
                    await conv.send_message(s)
                except:
                    await conv.send_message('🤷🏼 Caliming funds failed. '
                                            'Private key\'s probably incorrect. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'unlock'))
async def b_unlock(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('💁🏼 Which NFT do you want to unlock? (Enter the ID number)')
                nft_id_msg = await handle
                try:
                    nft_id = int(nft_id_msg.text.strip())
                    handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                    await conv.send_message('💁🏼 What address do you want to move the NFT to?')
                    to_msg = await handle
                    to = to_base16(to_msg.text.strip())
                    if is_base16_address(to):
                        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                        await conv.send_message('🔓 You\'re about to move NFT #' + str(nft_id) + ' to ' + to
                                                + '.\n\n🔐 Please enter your private key:\n\n'
                                                  '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                                  ' Don\'t believe it? Learn [how to make your own bot]'
                                                  '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                                link_preview=False)
                        private_key_msg = await handle
                        try:
                            private_key = private_key_msg.text.strip()
                            account = Account(private_key=private_key)
                            contract.account = account
                            await conv.send_message('⏳ Please wait...')
                            resp = contract.call(method="RemoveNFT", params=[
                                Contract.value_dict('to', 'ByStr20', to),
                                Contract.value_dict('nft_num', 'Uint256', str(nft_id))
                            ])
                            if contract.last_receipt['success']:
                                s = '✅ You just moved NFT #' + str(nft_id) + ' to ' + to \
                                    + '. Transaction used ' + contract.last_receipt['cumulative_gas'] \
                                    + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                            else:
                                error_str = str(contract.last_receipt['exceptions'])
                                error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                            .strip(')'))
                                s = '🤷🏼 Unlocking NFT failed because ' + errors[error]
                            await conv.send_message(s)
                        except:
                            await conv.send_message('🤷🏼 Unlocking NFT failed. Private key\'s probably incorrect. '
                                                    'Please start again.')
                    else:
                        await conv.send_message('❌ It doesn\'t seem to be a valid address. Please start again.')
                except:
                    await conv.send_message('🤷🏼 You can\'t unlock NFT. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'update'))
async def b_update(event):
    async with bot.conversation(event.query.user_id, timeout=1000) as conv:
        handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
        await conv.send_message('⚠️ Contract status will automatically be updated upon every transition call '
                                'by anybody. Unless the status is `Unknown`, updating status has no effect at all. '
                                'Please proceed only if the contract status is `Unknown`.\n\n'
                                '🔖 Please enter the contract address:')
        contract_address_msg = await handle
        contract_address = to_base16(contract_address_msg.text.strip())
        if is_base16_address(contract_address):
            try:
                contract = Contract.load_from_address(contract_address, load_state=True)
                contract.get_state(get_init=True)
                init_list = contract.init
                for init in init_list:
                    if (init['vname'] == 'expiration_block'):
                        expiration_block = int(init['value'])
                contract_status_raw = contract.state['contract_status']
                tx_block_info = api.GetLatestTxBlock()
                block_left = expiration_block - int(tx_block_info['header']['BlockNum'])
                should_update = False
                if block_left <= 0:
                    if contract_status_raw != '400' and contract_status_raw != '500' and contract_status_raw != '600':
                        should_update = True
                if not should_update:
                    await conv.send_message('❌ Contract status is not `Unknown`. Updating status is in vain.')
                    return
                handle = conv.wait_event(events.NewMessage(from_users=event.query.user_id))
                await conv.send_message('🔄 You\'re about to update contract status. '
                                        '\n\n🔐 Please enter your private key:\n\n'
                                        '🧏🏼 Private key is used only for this transaction and is NOT logged or stored.'
                                        ' Don\'t believe it? Learn [how to make your own bot]'
                                        '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md).',
                                        link_preview=False)
                private_key_msg = await handle
                try:
                    private_key = private_key_msg.text.strip()
                    account = Account(private_key=private_key)
                    contract.account = account
                    await conv.send_message('⏳ Please wait...')
                    resp = contract.call(method="UpdateStatus", params=[])
                    if contract.last_receipt['success']:
                        s = '✅ You just updated the contract status.' \
                            ' Transaction used ' + contract.last_receipt['cumulative_gas'] \
                            + ' gas and is stored on block #' + contract.last_receipt['epoch_num'] + '.'
                    else:
                        error_str = str(contract.last_receipt['exceptions'])
                        error = int(error_str[error_str.index('(Int32 ') + 7:error_str.index('(Int32 ') + 10]
                                    .strip(')'))
                        s = '🤷🏼 Updating status failed because ' + errors[error]
                    await conv.send_message(s)
                except:
                    await conv.send_message('🤷🏼 Updating status failed. '
                                            'Private key\'s probably incorrect. Please start again.')
            except:
                await conv.send_message('❌ This isn\'t a CollectiveNFT contract.')
        else:
            await conv.send_message('❌ It doesn\'t seem to be a valid address.')
    raise events.StopPropagation


@bot.on(events.CallbackQuery(data=b'help'))
async def b_help(event):
    msg_str = '💁🏼 For more info and getting help, you may visit:\n\n' \
              '* [CollectiveNFT project at GitHub]' \
              '(https://github.com/nickyharpor/CollectiveNFT)\n' \
              '* [NFT Owner Walkthrough]' \
              '(https://github.com/nickyharpor/CollectiveNFT/blob/main/owner_walkthrough.md)\n' \
              '* [Lenders Walkthrough]' \
              '(https://github.com/nickyharpor/CollectiveNFT/blob/main/lenders_walkthrough.md)\n' \
              '* [How to Make your own Bot]' \
              '(https://github.com/nickyharpor/CollectiveNFT/blob/main/your_own_bot.md)\n' \
              '* [What can be done in each Contract Phase (for devs/auditors)]' \
              '(https://github.com/nickyharpor/CollectiveNFT/blob/main/contract_phases.md)\n' \
              '* [Zilliqa Homepage]' \
              '(https://www.zilliqa.com/)'
    await bot.send_message(event.chat_id, msg_str, link_preview=False)
    raise events.StopPropagation


@bot.on(events.NewMessage())
async def echo(event):
    # uncomment for debug
    # print(event.text)
    pass


def main():
    bot.run_until_disconnected()


def get_contract_as_str():
    contract_file = open('CollectiveNFT.scilla', 'r')
    contract_str = contract_file.read()
    contract_file.close()
    return contract_str


def is_base16_address(s):
    if s is None:
        return False
    if len(s) == 42 and s.startswith('0x'):
        return re.fullmatch(r"^[0-9a-fA-F]+", s[2:]) is not None
    else:
        return False


def to_base16(s):
    if s is None:
        return None
    if s.startswith('0x'):
        s = s[2:]
    try:
        account = Account(address=s)
        return '0x' + str(account.address)
    except:
        return None


def to_bech32(s):
    if s is None:
        return None
    if s.startswith('0x'):
        s = s[2:]
    try:
        account = Account(address=s)
        return str(account.bech32_address)
    except:
        return None


async def functions(event, msg=None):
    if msg is None:
        msg_str = '🙋🏼 Welcome to CollevtiveNFT bot. This simple bot helps you create and manage a ' \
                '[CollectiveNFT contract](https://github.com/nickyharpor/CollectiveNFT) on ' \
                'Zilliqa\'s testnet.\n\n' \
                '🙅🏼 **No user data is logged or stored.**\n\n' \
                '💁🏼 What do you want to do?'
    else:
        msg_str = str(msg)
    opt_list = [
        [Button.inline('New Contract', b'new'),
         Button.inline('🆓 Contract Status 🆓', b'status')],
        [Button.inline('🆓 List NFTs 🆓', b'list'),
         Button.inline('🆓 Check Balance 🆓', b'balance')],
        [Button.inline('Buy Tokens', b'buy'),
         Button.inline('Transfer Tokens', b'transfer')],
        [Button.inline('Burn Tokens', b'burn'),
         Button.inline('Cancel Contract [Owner]', b'cancel')],
        [Button.inline('Close Contract [Owner]', b'close'),
         Button.inline('Add Funds [Owner]', b'add')],
        [Button.inline('Move Funds [Owner]', b'move'),
         Button.inline('Claim Funds', b'claim')],
        [Button.inline('Unlock an NFT [Owner]', b'unlock'),
         Button.inline('Update Status', b'update')],
        [Button.inline('🧑🏼‍🏫 Help 🧑🏼‍🏫', b'help')]
    ]
    await bot.send_message(event.chat_id, msg_str, buttons=opt_list, link_preview=False)
    raise events.StopPropagation


if __name__ == '__main__':
    main()
