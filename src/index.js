require('dotenv').config()
const Connection = require('./connection');
const Discord = require('discord.js');

const webhook = new Discord.WebhookClient(process.env.DISCORD_SERVER_ID, process.env.DISCORD_CHANNEL_ID)
console.log(process.env.DISCORD_SERVER_ID)
const con = new Connection();


const go = async() => {

  console.log(new Date, 'connecting...');
  await con.connect();
  console.log(new Date, 'connected');

  //const channelId = await con.subscribe(['ETH/EUR', 'XBT/EUR'], 'ticker');

  const channelId = await con.subscribe('ETH/EUR', 'ticker');
  //console.log(con.pairs)
  //const channelId2 = await con.subscribe('XBT/EUR', 'ticker');
  //console.log(con.pairs)
  //const channelIdX = await con.subscribe('XBT/EUR', 'book', {depth: 10});
  console.log(new Date, 'subscribed');

  

  con.on('channel:' + channelId, (data) => {
    const lastTradePrice = JSON.parse(data[1].c[0]);

    //console.log(data);
    console.log('Ether')
    console.log(new Date().toISOString());
    console.log('lastTradePrice ' + lastTradePrice);
    console.log();

    const discordMsg = 'Price update! ' + lastTradePrice + ' EUR/ETH @ Kraken.com';
    webhook.send(discordMsg)
    

  });


   
  con.on('message', (data) => {
    // console.log(data);
  });

}

go();