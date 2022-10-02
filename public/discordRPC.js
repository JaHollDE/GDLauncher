const { Client } = require('discord-rpc');
const log = require('electron-log');

let client;
let activity;

const initialAppStartup = Math.floor(Date.now() / 1000);

const defaultValue = {
  details: 'Im Launcher',
  state: 'www.jaholl.de',
  startTimestamp: initialAppStartup,
  largeImageKey: 'jahollde',
  largeImageText: 'JaHollDE - Minecraft Roleplay',
  instance: false
};

const messages = ["www.jaholl.de", "Jetzt beitreten!"];

exports.initRPC = () => {
  client = new Client({ transport: 'ipc' });

  activity = defaultValue;

  client.on('ready', () => {
    log.log('Discord RPC Connected');
    client.setActivity(activity);

    setInterval(() => {
      const msgs = messages.filter(l => activity.state !== l);
      const randomMessage = msgs[Math.floor(Math.random()*msgs.length)];
      activity.state = randomMessage;
      client?.setActivity(activity);
    }, 60*1000);
  });

  client.login({ clientId: '931843550801449011' }).catch(error => {
    if (error.message.includes('ENOENT')) {
      log.error('Unable to initialize Discord RPC, no client detected.');
    } else {
      log.error('Unable to initialize Discord RPC:', error);
    }
  });
};

exports.update = details => {
  if (!client) return;
  activity = {
    ...activity,
    startTimestamp: Math.floor(Date.now() / 1000),
    details: `Playing ${details}`
  };
  client.setActivity(activity);
};

exports.reset = () => {
  if (!client) return;
  activity = defaultValue;
  activity.startTimestamp = initialAppStartup;
  client.setActivity(activity);
};

exports.shutdownRPC = () => {
  if (!client) return;
  client.clearActivity();
  client.destroy();
  client = null;
  activity = null;
};
