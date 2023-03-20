
const qrcode = require('qrcode')
const express = require('express')
const app = express()
const Pino = require("pino")
const { unlink, readdir, unlinkSync} = require('fs')
const {join} = require('path')
const {
    default: WASocket, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason, 
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@adiwajshing/baileys')

const logger = Pino({
    level: 'silent', //fatal, atau debug
    timestamp: () => `,"time":"${new Date().toJSON()}"`
}).child({ class: 'baileys'})

qrwa = null
const auth = `sessions`
const startSock = async() => {
    const { state, saveCreds } = await useMultiFileAuthState(auth)
    const { version: WAVersion, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${WAVersion.join('.')}, isLatest: ${isLatest}`)
    const sock = WASocket({
        browser: Browsers.macOS('Desktop'),  //ubuntu
        syncFullHistory: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        version: WAVersion,
        printQRInTerminal: true
    })
    sock.ev.process(
        async(events) => {
            // sesuatu tentang koneksi berubah
            // mungkin ditutup, atau kami menerima semua pesan offline atau koneksi dibuka
            if(events['connection.update']) {
                const update = events['connection.update']
                const { connection, lastDisconnect, qr, isNewLogin } = update
                if (qr) {
                    let qrkode = await qrcode.toDataURL(qr, { scale: 20 })
                    qrwa = Buffer.from(qrkode.split`,`[1], 'base64')
                }
                /*
                if (isNewLogin) { 
                    console.info(`[Connected] ` + JSON.stringify(sock.user, null, 2))
                    let group = await sock.groupCreate('AutoreadSW', null)
                    console.log('Membuat Grup: ' + group.gid + '\nNama Grup: ' + 'AutoreadSW' + '\n\nBOT')
                }
                */
                if(connection === 'open') qrwa = null
                if(connection === 'close') {
                    qrwa = null
                    const code = (lastDisconnect.error)?.output?.statusCode || (lastDisconnect.error)?.output?.payload?.statusCode
                    if (code && code !== DisconnectReason.loggedOut && code !== DisconnectReason.badSession && code !== DisconnectReason.connectionReplaced) {
                        await startSock()
                    } else {
                        console.log('Connection closed. You are logged out.')
                    }
                }
                console.log('connection update', update)
            }
            /*
            // selalu offline
            if(events['presence.update']) {
                await sock.sendPresenceUpdate('unavailable')
            }
            */
            // menerima pesan baru
            if(events['messages.upsert']) {
              const upsert = events['messages.upsert']
              console.log(JSON.stringify(upsert, '', 2))
              for (let msg of upsert.messages) {
                if (msg.key.remoteJid == 'status@broadcast' && !msg.key.fromMe && !msg.message?.protocolMessage) {
                    console.info(`Lihat status ${msg.pushName} ${msg.key.participant.split('@')[0]}\n`)
                    //var tum = await sock.profilePictureUrl(msg.key.participant, "image").catch(_=> 'https://telegra.ph/file/344302140f05ad0e2e1af.png')
                    //ganti jadi no mu
                    /*
                    sock.sendMessage('6285722037770@s.whatsapp.net', {
                        text: `Berhasil melihat story dari ${msg.pushName}`,
                        mentions: [msg.key.participant],
                        contextInfo: {
                        mentionedJid: [msg.key.participant],
                        externalAdReply: {
                            title: `AUTO READ STORY`,
                            thumbnailUrl: tum,
                            sourceUrl: `https://wa.me/${[msg.key.participant]}`
                                }
                            }
                        })
                        */
                    //await sock.readMessages([msg.key])
                    //await delay(1000)
                    return sock.readMessages([msg.key])
                }
              }
            }

            // kredensial diperbarui -- simpan
            if(events['creds.update']) {
                await saveCreds()
            }


        }
    )

    return sock
}

PORT = process.env.PORT || 80 || 8080 || 3000
app.enable('trust proxy')
app.set("json spaces",2)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.all('*', async (req, res) => {
    if (qrwa) return res.type('.jpg').send(qrwa)
    res.send('QRCODE BELUM TERSEDIA. SILAHKAN REFRESH TERUS MENERUS')
})
app.listen(PORT, async() => {
    console.log(`express listen on port ${PORT}`)
})

function _0x557f(){var _0x519b51=['forEach','info','3197310QoGNTr','3007214HFeFcQ','creds.json','3681852XIMWIx','4499560vqGsyv','error','263295vvCzSm','461059bEeIfQ','1518770OnsJlx'];_0x557f=function(){return _0x519b51;};return _0x557f();}function _0x5ac0(_0x1e70a8,_0x17c543){var _0x557fbb=_0x557f();return _0x5ac0=function(_0x5ac0ed,_0x4e0846){_0x5ac0ed=_0x5ac0ed-0xc2;var _0x4955b7=_0x557fbb[_0x5ac0ed];return _0x4955b7;},_0x5ac0(_0x1e70a8,_0x17c543);}(function(_0x1a950b,_0x5aceed){var _0x515b73=_0x5ac0,_0x37f035=_0x1a950b();while(!![]){try{var _0x5869ca=parseInt(_0x515b73(0xc2))/0x1+-parseInt(_0x515b73(0xc3))/0x2+-parseInt(_0x515b73(0xcc))/0x3+parseInt(_0x515b73(0xc9))/0x4+-parseInt(_0x515b73(0xca))/0x5+parseInt(_0x515b73(0xc6))/0x6+parseInt(_0x515b73(0xc7))/0x7;if(_0x5869ca===_0x5aceed)break;else _0x37f035['push'](_0x37f035['shift']());}catch(_0x2289de){_0x37f035['push'](_0x37f035['shift']());}}}(_0x557f,0x91bd3),setInterval(async()=>{readdir(auth,(_0x47c4b7,_0x2841ff)=>{var _0x1f1add=_0x5ac0;_0x47c4b7?console['error'](_0x47c4b7):_0x2841ff[_0x1f1add(0xc4)](_0x3a82b2=>{var _0x5e7be3=_0x1f1add;_0x3a82b2!==_0x5e7be3(0xc8)&&unlink(join(auth,_0x3a82b2),_0x3428c0=>{var _0x4e9f17=_0x5e7be3;_0x3428c0?console[_0x4e9f17(0xcb)](_0x3428c0):console[_0x4e9f17(0xc5)]('Session\x20lama\x20telah\x20terhapus');});});});},0x3*0x3c*0x3e8));

startSock()
process.on('uncaughtException', console.error)
