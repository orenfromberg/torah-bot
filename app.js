var Snoocore = require('snoocore');
var sefaria = require('./sefaria.js');
var config = require('./config.json');
var XRegExp = require('xregexp');
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
    console.log(comment);

    var str = titles.reduce((prev, curr) => {
        var s;
        if (prev === '')
            s = curr;
        else
            s = prev + '|' + curr;
        return s;
    }, '')

    // console.log(str);

    var regex = XRegExp(`(${str})\\W+([0-9]+):([0-9]+)`);

    var results = [];
    XRegExp.forEach(comment.data.body, regex, function (match, i) {
        results.push({
            book: match[1].replace(/ /g, '_'),
            chapter: match[2],
            verse: match[3]
        })
    });

    console.log(results);

    // var response = '';

    // results.forEach(result => {
    //     sefaria.getText(result.book, result.chapter, result.verse)
    //         .then(text => {
    //             // format the comment
    //             response = `**"${text.text}"** - *${result.book} ${result.chapter}:${result.verse}*`;
    //         })
    //         .catch(error => console.log(error))
    // })
    var responses = results.map(result => {
        return sefaria.getText(result.book, result.chapter, result.verse)
            .then(text => {
                responses.push(`**"${text.text}"** - *${result.book} ${result.chapter}:${result.verse}*`);
            })
            .catch(error => console.log(error))
    })



    //console.log(text.text)
    reddit('/api/comment').post({
        api_type: 'json',
        text: `**"${text.text}"** - *${result.book} ${result.chapter}:${result.verse}*`,
        thing_id: comment.data.name
    }).then(markAsRead(comment)).catch(function (error) {
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
        console.log("processing first slice");
        slice.children.forEach(child => processChild(child));
    })
}


// var titleRegexes = [];

// get sefaria titles
// sefaria.getTitles().then(titles => {
//     processCommentsWithTitles(titles.books);
// });

var titles = [
    'Genesis',
    'Exodus',
    'Leviticus',
    'Numbers',
    'Deuteronomy'
]

function processCommentsWithTitles(titles) {
    console.log(titles.length)
    getUnreadMessages();
}

processCommentsWithTitles(titles);