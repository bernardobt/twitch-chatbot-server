
# Twitch Chat Bot Server

Simple node js twitch chat bot for studies purpose. 

It will connect to a twitch channel chat and relay its messages to a front-end client.

Based on https://dev.twitch.tv/docs/chat/chatbot-guide/.

It starts a second web socket server to act as an intermediador between the twtch chat and my front-end application.

*Keep in mind that this application was designed with the intent of running locally.*



### Environment variables

You will need to register the app in twitch and get the needed credentials.

>More Information: https://dev.twitch.tv/docs/authentication/register-app/
>
>>**CLIENT_ID**
>>
>>**CLIENT_SECRET**
>
>**REFRESH_TOKEN** and **OAUTH_TOKEN** can be obtained following the instructions at: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/

>The IDs can be obtained from https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/
>
>>**BOT_USER_ID**= the ID of the bot. *This is ***NOT*** the bot account name*
>>
>>**CHAT_CHANNEL_USER_ID**= the ID of the channel you want to connect the server. *This is ***NOT*** the channel account name*

>The ports for the websockets servers
>>
>>**INTERMEDIATE_WS_PORT**= port for the internal websocket server that relays messages to the front end.


>You will need a secret key for encryption purposes.
>
>>SECRET_KEY=
>
>Length: For AES-256-CBC, the key must be 32 bytes (64 hex characters).
>
>Format: Typically represented as a hex string or securely generated random bytes.

### tokens.txt

OAuth and Refresh tokens expire from time to time and to avoid manually changing everytime, a new function for refreshing the tokens was implemented.

Having renewable variables in environment is not ideal, thus it was opted for storing them values in a txt file. 

The information stored in this file is encrypted.

You will need to encrypt the following object a first time:

{"accessToken":"your-oauth-token","refreshToken":"your-refresh-token"}

You can use the encrypt function from handleTokens.js to do it.









