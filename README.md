
# Twitch Chat Bot Server

Simple node js twitch chat bot for studies purpose. 

It will connect to a twitch channel chat and relay its messages to a front-end client.

Based on https://dev.twitch.tv/docs/chat/chatbot-guide/.

It starts a second web socket server to act as an intermediador between the twtch chat and my front-end application.

*Keep in mind that this application was designed with the intent of running locally.*

### Environment variables

You will need to register the app in twitch and get the needed credentials.

More Information: https://dev.twitch.tv/docs/authentication/register-app/


>The following can be obtained following this: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/
>
>>**CLIENT_ID**
>>
>>**OAUTH_TOKEN**
>>
>>**REFRESH_TOKEN**
>>
>>**ACCESS_TOKEN**
>>
>>**CLIENT_SECRET**
>

>The IDs can be obtained from https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/
>
>>**BOT_USER_ID**= the ID of the bot. *This is ***NOT*** the bot account name*
>>
>>**CHAT_CHANNEL_USER_ID**= the ID of the channel you want to connect the server. *This is ***NOT*** the channel account name*

>The ports for the websockets servers
>
>> **PORT**=  port for the server to run
>>
>>**INTERMEDIATE_WS_PORT**= port for the internal websocket server that relays messages to the front end.








