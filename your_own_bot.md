## How to Make your Own Bot?

CollectiveNFT's Telegram bot
([@collective_nft_bot](https://t.me/collective_nft_bot))
requires your private key for some functions to work. This is inevitable,
as there is no Telegram wallet to call and connect to. Private keys are NOT
stored or logged anywhere, but you don't have to believe it. You can have
your own bot. Here is how:

### 1. Clone this Repository

In general: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository

On Ubuntu: `git clone https://github.com/nickyharpor/CollectiveNFT.git`

### 2. Go to the Directory

In general: Open the cloned folder that has just appeared!

On Ubuntu: `cd CollectiveNFT`

### 3. Install Python 3

In general: https://www.python.org/downloads/

On Ubuntu: `apt install python3 python3-venv python3-pip`

### 4. Create a Virtual Environment

In general: https://docs.python.org/3/library/venv.html

On Ubuntu: `python3 -m venv venv`

### 5. Activate `venv`

In general: https://docs.python.org/3/tutorial/venv.html

On Ubuntu: `source venv/bin/activate`

### 6. Install Requirements

Inside virtual environment: `pip install -r requirements.txt`

### 7. Get a token from @BotFather in Telegram

Open https://t.me/BotFather and follow the instructions.

### 8. Get `api_id` and `api_hash` from Telegram

Open https://my.telegram.org/apps and request.

### 9. Edit `conf.py`

Enter your own `api_id`, `api_hash`, and `bot_token` in `conf.py`.

### 10. Run the bot

Inside virtual environment: `python3 bot.py`
