import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc'; // Define encryption algorithm
const SECRET_KEY = Buffer.from(process.env.SECRET_KEY, 'base64');  // Store a secure key in env file
const iv = crypto.randomBytes(16); 

export function encrypt(text) {    
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;  // Include IV for decryption
}

export function decrypt(text) {    
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex'); 
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export async function storeTokens(accessToken, refreshToken) {
    console.log("Store tokens");    
    const data = JSON.stringify({ accessToken, refreshToken });
    const encrypted = encrypt(data);    
    fs.writeFileSync('./tokens.txt', encrypted);
}

export async function loadTokens() {
    try {
        const data = fs.readFileSync('./tokens.txt', 'utf8');
        if (!data) {
            throw new Error("Token file is empty.");
        }
  
        const decrypted = decrypt(data);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error("Failed to load tokens:", error.message);
        return { accessToken: null, refreshToken: null }; // Return null to indicate failure
    }
}
