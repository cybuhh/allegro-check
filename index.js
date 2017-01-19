'use strict';

const request = require('request');
const promise = require('./promise');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const crypto = require('crypto');

const hash = data => (
  crypto.createHash('md5')
  .update(data, 'utf8')
  .digest('hex')
)

const redis = require('./redis')(process.env.REDIS_URL, 'allegro');

const MINUTE = 60;
const HOUR = MINUTE * 60;

const checkSite = () => {
  console.info(`Fetching ${process.env.REQUEST_URL}`);

  return promise(null, request)({
    url: process.env.REQUEST_URL,
  })
  .then((response) => {
    console.info('Processing response');
    const doc = new Dom({ errorHandler: () => false }).parseFromString(response.body);
    return Promise.all(xpath.select('//*[@class="offer-title"]', doc).map((item) => {
      const key = hash(item.getAttribute('href'));
      return redis.get(key)
      .then((result) => {
        if (result) {
          return redis.expire(key, HOUR).then(() => false);
        }
        return redis.set(key, true, HOUR).then(() => item);
      });
    }));
  })
  .then(result => result.filter(item => item))
  .then((result) => {
    if (result.length) {
      return Promise.all(result.map((item) => {
        console.info(`New item: ${item.childNodes[0].nodeValue}`);
        return promise(null, request)({
          method: 'POST',
          url: 'https://api.pushbullet.com/v2/pushes',
          headers: {
            'Access-Token': process.env.PUSHBULLET_TOKEN,
          },
          followRedirect: true,
          json: true,
          body: {
            type: 'link',
            title: 'New auction',
            body: item.childNodes[0].nodeValue,
            url: item.getAttribute('href'),
          },
        }).catch(console.error);
      }));
    }
    return false;
  })
  .then(() => setTimeout(checkSite, MINUTE * 1000))
  .catch(console.error);
};

checkSite();
