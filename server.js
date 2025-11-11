import WebSocket, { WebSocketServer } from 'ws';
import { storeTokens, loadTokens } from './handleTokens.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const CHAT_CHANNEL_USER_ID = process.env.CHAT_CHANNEL_USER_ID;
const BOT_USER_ID = process.env.BOT_USER_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
let OAUTH_TOKEN;
let REFRESH_TOKEN;

const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';

var websocketSessionID;

// Start executing the bot from here
(async () => {	
	await loadTokensAndSet(); // Load tokens from the file
	
    // Start WebSocket client and register handlers
    const websocketClient = startWebSocketClient();
})();

async function loadTokensAndSet() {
    const tokens = await loadTokens();
	
    if (!tokens.accessToken || !tokens.refreshToken) {
		console.error("No valid tokens found.");
        process.exit(1); // Exit the process or handle it as per your application's need
    }
	
    OAUTH_TOKEN = tokens.accessToken;
    REFRESH_TOKEN = tokens.refreshToken;

    await getAuth();
}

// WebSocket will persist the application loop until you exit the program forcefully

async function getAuth() {
	// https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token
	let response = await fetch('https://id.twitch.tv/oauth2/validate', {
		method: 'GET',
		headers: {
			'Authorization': 'OAuth ' + OAUTH_TOKEN
		}
	});
	
	if (response.status != 200) {
		let data = await response.json();
		console.error("Token is not valid. /oauth2/validate returned status code " + response.status);
		console.error(data);
		await refreshOAuthToken();
		// process.exit(1);
	}

	console.log("Validated token.");
}

function startWebSocketClient() {
	let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

	websocketClient.on('error', console.error);

	websocketClient.on('open', () => {
		console.log('WebSocket connection opened to ' + EVENTSUB_WEBSOCKET_URL);
	});

	websocketClient.on('message', (data) => {
		handleWebSocketMessage(JSON.parse(data.toString()));
	});

	

	return websocketClient;
}

function handleWebSocketMessage(data) {
	
	switch (data.metadata.message_type) {
		case 'session_welcome': // First message you get from the WebSocket server when connecting
		websocketSessionID = data.payload.session.id; // Register the Session ID it gives us
		
		// Listen to EventSub, which joins the chatroom from your bot's account
		registerEventSubListeners();
		break;
		case 'notification': // An EventSub notification has occurred, such as channel.chat.message
		
		switch (data.metadata.subscription_type) {
				case 'channel.chat.message':
					// First, print the message to the program's console.
					console.log(`MSG #${data.payload.event.broadcaster_user_login} <${data.payload.event.chatter_user_login}> ${data.payload.event.message.text}`);
					
                    broadcastMessage(JSON.stringify({
                        message_type: data.payload.event.message_type,
                        content: {
                            channel: data.payload.event.broadcaster_user_login,
                            user_login: data.payload.event.chatter_user_login,
                            user_name: data.payload.event.chatter_user_name,
							color: data.payload.event.color,
                            message: data.payload.event.message.text,
                        }
                    }))

					// // Then check to see if that message was "HeyGuys"
					// if (data.payload.event.message.text.trim() == "HeyGuys") {
					// 	// If so, send back "VoHiYo" to the chatroom
					// 	sendChatMessage("VoHiYo")
					// }

					break;
			}
			break;
	}
}

async function sendChatMessage(chatMessage) {
	let response = await fetch('https://api.twitch.tv/helix/chat/messages', {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + OAUTH_TOKEN,
			'Client-Id': CLIENT_ID,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			broadcaster_id: CHAT_CHANNEL_USER_ID,
			sender_id: BOT_USER_ID,
			message: chatMessage
		})
	});

	if (response.status != 200) {
		let data = await response.json();
		console.error("Failed to send chat message");
		console.error(data);
	} else {
		console.log("Sent chat message: " + chatMessage);
	}
}

async function registerEventSubListeners() {
	// Register channel.chat.message
	let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + OAUTH_TOKEN,
			'Client-Id': CLIENT_ID,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			type: 'channel.chat.message',
			version: '1',
			condition: {
				broadcaster_user_id: CHAT_CHANNEL_USER_ID,
				user_id: BOT_USER_ID
			},
			transport: {
				method: 'websocket',
				session_id: websocketSessionID
			}
		})
	});

	if (response.status != 202) {
		let data = await response.json();
		console.error("Failed to subscribe to channel.chat.message. API call returned status code " + response.status);
		console.error(data);
		process.exit(1);
	} else {
		const data = await response.json();
		console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
	}
}



// intermediate websocket server
const iwss = new WebSocketServer({port: process.env.INTERMEDIATE_WS_PORT})

iwss.on("connection", (ws) => {
    console.log("Client connected to iwss");
    ws.on('close', () => {
        console.log('Client disconnected from iwss');
    });
    
})

function broadcastMessage(message) {
    iwss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

async function refreshOAuthToken() {
	console.log("Refreshing OAuth tokens");    
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
        headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
			client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    
    if (response.ok) {
		console.log("Response is ok");		
        const data = await response.json();
        OAUTH_TOKEN = data.access_token; // Update in memory
        REFRESH_TOKEN = data.refresh_token; // Update in memory				
        await storeTokens(OAUTH_TOKEN, REFRESH_TOKEN); // Store the new tokens
		
    } else {
        const errorData = await response.json();
        console.error("Failed to refresh OAuth token:", errorData);
        process.exit(1);
    }
}
