var Snoocore = require('snoocore');
var sefaria = require('./sefaria.js');
var config = require('./config.json');
var XRegExp = require('xregexp');

// const subredditComments = '/r/judaism/comments';
const subredditComments = '/r/test/comments';

var latestComment;
var numUpdates = 0;

// Our new instance associated with a single account.
// It takes in various configuration options.
var reddit = new Snoocore({
    userAgent: '/u/TorahBot torah-bot@1.0.0', // unique string identifying the app
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

function markCommentAsRead(message) {
    // console.log("marking comment as read");
    reddit('/api/read_message').post({
        id: message.data.name    
    }).then(function () {
        console.log("message " + message.data.name + " marked as read.")
    });
}

function processComment(comment) {
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
    }).then(markCommentAsRead(comment)).catch(function (error) {
        console.log("unable to respond: " + error)
    });

}

function processChild(child) {
    if (child.kind === 't1')
        processComment(child);
    else // mark as read
        markCommentAsRead(child);
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

var titles = require('./titles.json');

// function processCommentsWithTitles(titles) {
//     console.log(titles.length)
//     getUnreadMessages();
// }

// processCommentsWithTitles(titles);

function printSlice(slice) {
  console.log('>>> Children in this slice', slice.children.length);
  slice.children.forEach(function(child) {
    console.log('[score: ' + child.data.score + '] ' + child.data);
  });
}

// get information about a user
// reddit('/user/o_m_f_g/about').get().then(function(result) {

//   console.log(result); // information about a user account

//   // Use the listing helper to gracefully handle listings
//   // Returns a promise for a slice -- a piece of a listing.
//   return reddit(subredditComments).listing({ limit: 100, before: "" });
// }).then(function(slice) {
//   printSlice(slice);   // First page children
//   return slice.next(); // A promise for the next slice in the listing
// }).then(function(slice) {
//   printSlice(slice);   // Second page children
//   console.log('done!');
// }).catch(function(error) {
//   console.error('oh no!', error.stack);
// });




function handleChild(child) {

    if (child.data.author === 'TorahBot')
        return;

    var results = [];
    XRegExp.forEach(child.data.body, regex, function (match, i) {
        results.push({
            book: match[1].replace(/ /g, '_'),
            chapter: match[2],
            verse: match[3]
        })
    });

    console.log(results);

    // we have results, now fetch from sefaria.

    var promises = results.map(psuk => {
        return sefaria.getText(psuk.book, psuk.chapter, psuk.verse)
            .then(text => {
                return {
                    text_en: text.text,
                    text_he: text.he,
                    book: psuk.book,
                    chapter: psuk.chapter,
                    verse: psuk.verse
                }
            })
            .catch(error => console.log(error))
    })


    Promise.all(promises)
        .then(results => {
            var comment = '';
            results.forEach(item => {
                comment = comment + '>' +item.text_he + '\n\n'
                    + '_\"' + item.text_en + '\"_\n\n'
                    + item.book + ' '
                    + item.chapter + ':'
                    + item.verse + '\n\n';
            })
            return comment;
        })
        .then(comment => {
            reddit('/api/comment').post({
                api_type: 'json',
                text: comment,
                thing_id: child.data.name
            }).catch(function (error) {
                console.log("unable to respond: " + error)
            });
        })
        .catch(error => {
            console.log(error);
        });
}

function initialFetchComments() {
    reddit(subredditComments).listing({ limit: 100 })
        .then(slice => {
            if (slice.children.length > 0)
                latestComment = slice.children[0].data;
        });
}

// fetch the comments that have not been handled yet.
function fetchComments() {
    numUpdates++;
    console.log("num updates = " + numUpdates);
    console.log("fetching with latestComment = " + latestComment.name)
    reddit(subredditComments).listing({ limit: 100, before: latestComment.name})
        .then(slice => {
            if (slice.children.length > 0)
                latestComment = slice.children[0].data;
            slice.children.forEach(child => handleChild(child));
        });
}

// get regex
var str = titles.reduce((prev, curr) => {
    if (prev === '')
        return curr;
    else
        return prev + '|' + curr;
}, '')

var regex = XRegExp(`(${str})\\W+([0-9]+):([0-9]+)`);

initialFetchComments();
setInterval(fetchComments, 5000);