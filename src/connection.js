const WebSocket = require('ws');
const EventEmitter = require('events');

class Connection extends EventEmitter {
  constructor(url = 'wss://ws.kraken.com') {
    super();

    this.url = url;
    this.connected = false;

    this.pairs = {};

    this.lastMessageAt = 0;
  }

  disconnect() {
    this.ws.disconnect();
  }

  connect() {
    if (this.connected) {
      return;
    }

    let readyHook;
    this.onOpen = new Promise((r) => {
      readyHook = r;
    });

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      readyHook();
    };

    this.ws.onerror = (e) => {
      console.log(new Date(), '[KRAKEN] error', e);
      this.ws.close();
    };
    this.ws.onclose = (e) => {
      console.log(new Date(), '[KRAKEN] close', e);
    };

    // initial book data coming in on the same tick as the subscription data
    // we defer this so the subscription promise resloves before we send initial OB data.
    this.ws.onmessage = (e) => {
      setImmediate(() => {
        this.handleMessage(e);
      });
    };

    return this.onOpen;
  }

  handleMessage = (e) => {
    this.lastMessageAt = +new Date();

    const payload = JSON.parse(e.data);

    if (Array.isArray(payload)) {
      //console.log(payload)
      this.emit('channel:' + payload[0], payload);
    } else {
      if (
        payload.event === 'subscriptionStatus' &&
        payload.status === 'subscribed'
      ) {
        if (this.pairs[payload.pair]) {
          this.pairs[payload.pair].id = payload.channelID;
          this.pairs[payload.pair].onReady(payload.channelID);
        } else {
          console.log(
            new Date(),
            '[KRAKEN] received subscription event for unknown subscription',
            payload,
          );
        }

        return;
      }

      this.emit('message', payload);
    }
  };

  subscribe(pair, subscription, options) {
    // if(this.pairs[pair] && this.pairs[pair].subscriptions.includes(subscription)) {
    //   console.log(new Date, '[KRAKEN] refusing to subscribe to subscription twice', {pair, subscription});
    //   return;
    // }

    let hook;
    let onReady = new Promise((r) => {
      hook = r;
    });

    //if(!this.pairs[pair]) {
    this.pairs[pair] = {
      subscriptions: [],
      onReady: hook,
    };
    //}

    //console.log(this.pairs)

    this.pairs[pair].subscriptions.push(subscription);

    this._subscribe(pair, subscription, options);

    //console.log(onReady)
    return onReady;
  }

  _subscribe(pair, subscription, options = {}) {
    this.ws.send(
      JSON.stringify({
        event: 'subscribe',
        pair: [pair],
        subscription: {
          name: subscription,
          ...options,
        },
      }),
    );
  }

  ping() {
    this.ws.send(
      JSON.stringify({
        event: 'ping',
        reqid: 42,
      }),
    );
  }
}

module.exports = Connection;
