require('dotenv').config();
const Connection = require('./connection');
const Discord = require('discord.js');

const webhook = new Discord.WebhookClient({
  id: process.env.DISCORD_WEBHOOK_CLIENT_ID || 'DISCORD_WEBHOOK_CLIENT_ID',
  token:
    process.env.DISCORD_WEBHOOK_CLIENT_TOKEN || 'DISCORD_WEBHOOK_CLIENT_TOKEN',
});
const con = new Connection();

const go = async () => {
  console.log(new Date(), 'connecting...');
  await con.connect();
  console.log(new Date(), 'connected');

  const channelId = await con.subscribe('ETH/EUR', 'ticker');
  console.log(new Date(), 'subscribed');

  con.on('channel:' + channelId, (data) => {
    const lastTradePrice = JSON.parse(data[1].c[0]);

    console.log('Ether');
    console.log(new Date().toISOString());
    console.log('lastTradePrice ' + lastTradePrice);
    console.log();

    const discordMsg =
      'Price update! ' + lastTradePrice + ' EUR/ETH @ Kraken.com';
    webhook.send(discordMsg);
  });

  con.on('message', (data) => {
    // console.log(data);
  });
};

go();
