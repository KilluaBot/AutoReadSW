const qrcode = require('qrcode');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const speed = require("performance-now");
const path = require('path');
const fs = require('fs');
const util = require("util");
require("http").createServer((_, res) => res.end("BOT AKTIF!")).listen(PORT);
 let qrwa = null;
 app.enable('trust proxy');
app.set('json spaces', 2);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 function ngentok(req, res) {
  const laten = speed();
  const tenla = speed() - laten;
   if (qrwa) {
    return res.type('.jpg').send(qrwa);
  }
   const output = `SUCCESS\n
Latency: ${tenla.toFixed(4)} ms`;
   res.type('text/plain').send(output);
}
 app.all('*', ngentok);
 app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
 const Pino = require('pino');
const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  useMultiFileAuthState,
  DisconnectReason,
  delay
} = require('@adiwajshing/baileys');
 const msgRetryCounterMap = MessageRetryMap || {};
 const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
   // Fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
   const sock = makeWASocket({
    version,
    logger: Pino({
      level: 'silent',
      //@ts-ignore
      bindings: () => { }
    }),
    printQRInTerminal: true,
    auth: state,
    markOnlineOnConnect: false
  });
   sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
     if (qr) {
      let qrCode = await qrcode.toDataURL(qr, { scale: 20 });
      qrwa = Buffer.from(qrCode.split(',')[1], 'base64');
    }
     if (connection === 'open') {
      qrwa = null;
    }
     if (connection === 'close') {
      qrwa = null;
       let reason = (lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        startSock();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        startSock();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");
        startSock();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete Folder Session ${sessionName} and Scan Again.`);
        process.exit();
      } else if (reason === DisconnectReason.clientrtRequired) {
        console.log("Restart Required, Restarting...");
        startSock();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        startSock();
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
        startSock();
      }
    }
  });
   sock.ev.on('presence.update', async (update) => {
    await sock.sendPresenceUpdate('unavailable');
  });
   sock.ev.on('messages.upsert', async (upsert) => {
    await sock.readMessages([upsert.messages[0].key]);
    console.log(JSON.stringify(upsert, '', 2));
     for (let msg of upsert.messages) {
      if (msg.key.remoteJid === 'status@broadcast') {
        if (msg.message?.protocolMessage) {
          continue; // Skip if the message is a protocolMessage
        }
        console.log(`Lihat status ${msg.pushName} ${msg.key.participant.split('@')[0]}\n`);
        await sock.sendMessage("0@s.whatsapp.net", {
          text: `- *Status:* ${msg.pushName}\n- *Tag:* @${msg.key.participant.split('@')[0]}\n- *ID:* ${msg.key.id}`,
          mentions: [msg.key.participant]
        });
        // Use the appropriate client implementation here
      }
    }
  });
   sock.ev.on('creds.update', async () => {
    await saveCreds();
  });
   return sock;
};
 startSock();
 process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
 process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
 const file = path.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update ${file}`);
  delete require.cache[file];
  require(file);
});