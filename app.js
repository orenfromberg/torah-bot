var Snoocore = require('snoocore');
var sefaria = require('./sefaria.js');
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
        scope: ['identity', 'read', 'vote', 'privatemessages', 'submit']
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

var numUpdates = 0;

function markAsRead(message) {
    console.log("marking comment as read");
    reddit('/api/read_message').post({
        id: message.data.name    
    }).then(function () {
        console.log("message " + message.data.name + " marked as read.")
    });
}

function handleComment(comment) {
    //
    console.log("handling comment");

    // respond to comment
    reddit('/api/comment').post({
        api_type: 'json',
        text: 'Shalom aleichem, I am /u/TorahBot.',
        thing_id: comment.data.name
    }).then(markAsRead(comment)).catch(function(error) {
        console.log("unable to respond: " + error)
    });

}

function processChild(child) {
    if (child.kind === 't1')
        handleComment(child);
    else // mark as read
        markAsRead(child);
}

function getUnreadMessages() {
    numUpdates++;
    console.log("times updated: " + numUpdates);
    reddit('/message/unread').listing().then(function (slice) {

        // This is the front page of /r/askreddit
        // `slice.children` contains the contents of the page.
        console.log("processing first slice");
        console.log(slice.children);

        slice.children.forEach(child => processChild(child));

        // Get a promise for the next slice in this 
        // listing (the next page!)
        // return slice.next();

    })
    // .then(function (slice) {

    //     // This is the second page of /r/askreddit
    //     console.log("second slice");
    //     console.log(slice.children);
    //     slice.children.forEach(child => processChild(child));

    // });
}

// getUnreadMessages();
// setInterval(getUnreadMessages, 5000);


// get sefaria titles
// sefaria.getTitles().then(titles => {
//     processCommentsWithTitles(titles.books);
// });

// function processCommentsWithTitles(titles) {
//     console.log(titles.length);
// }

// sefaria.getText("genesis", 1, 1).then(text => console.log(text));