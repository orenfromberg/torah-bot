var Snoocore = require('snoocore');

var config = require('./config.json');
// Our new instance associated with a single account.
// It takes in various configuration options.
var reddit = new Snoocore({
  userAgent: '/u/username myApp@3.0.0', // unique string identifying the app
  oauth: {
    type: 'script',
    key: config['key'], // OAuth client key (provided at reddit app)
    secret: config['secret'], // OAuth secret (provided at reddit app)
    username: config['username'], // Reddit username used to make the reddit app
    password: config['password'], // Reddit password for the username
    // The OAuth scopes that we need to make the calls that we 
    // want. The reddit documentation will specify which scope
    // is needed for evey call
    scope: [ 'identity', 'read', 'vote', 'privatemessages' ]
  }
});

// reddit('/message/unread').get().then(function(result) {
//   console.log(result); 
// });

// reddit('/api/v1/scopes').get().then(function(result) {
//   console.log(result); 
// });

// Instead of an HTTP verb, use a Snoocore helper `.listing`
// It will return a "slice" for a listing that has various 
// helpers attached to it.
// reddit('/r/askreddit/hot').listing().then(function(slice) {
reddit('/message/unread').listing().then(function(slice) {
  
  // This is the front page of /r/askreddit
  // `slice.children` contains the contents of the page.
  console.log(slice.children);
  
  // Get a promise for the next slice in this 
  // listing (the next page!)
  return slice.next();
  
}).then(function(slice) {
  
  // This is the second page of /r/askreddit
  console.log(slice.children);
  
});