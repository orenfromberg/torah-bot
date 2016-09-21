var Snoocore = require('snoocore');
var sefaria = require('./sefaria.js');
var config = require('./config.json');
var XRegExp = require('xregexp');
var striptags = require('striptags');
var trim = require('trim');

// const subredditComments = '/r/judaism/comments';
const subredditComments = '/r/test/comments';
var latestComment;
var numUpdates = 0;
var header = '^בס\"ד'; //todo add to top of comment
var footer = '---\n^\/u\/TorahBot ^is ^powered ^by ^[Sefaria](http:\/\/www.sefaria.org).\n\n';

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

var titles = require('./titles.json');

function getComment(item) {
    return '---\n>' 
        + item.text_he + '\n\n'
        + '_\"' + item.text_en + '\"_  \n'
        + '[' 
        + item.book + ' '
        + item.chapter + ':'
        + item.verse + ']('
        + 'http:\/\/www.sefaria.org\/'
        + item.book + '.'
        + item.chapter + '.'
        + item.verse
        + ')\n\n';
}

function handleChild(child) {

    if (child.data.author === 'TorahBot')
        return;

    var results = [];
    XRegExp.forEach(child.data.body, regex, function (match, i) {
        var book = dictionary[match[1].toLowerCase()].replace(/ /g, '_');
        results.push({
            book: book,
            chapter: match[2],
            verse: match[3]
        })
    });

    console.log('text: ' + child.data.body);
    console.log('matches: ' + results);

    // we have results, now fetch from sefaria.

    var promises = results.map(psuk => {
        return sefaria.getText(psuk.book, psuk.chapter, psuk.verse)
            .then(text => {
                return {
                    text_en: trim(striptags(text.text)),
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
                if (item.text_he === '') return;
                comment = comment + getComment(item);
            })
            return comment;
        })
        .then(comment => {
            if (comment === '') throw 'no comment';
            reddit('/api/comment').post({
                api_type: 'json',
                // text: comment +  '---\n^\/u\/TorahBot ^is ^powered ^by ^[Sefaria](http:\/\/www.sefaria.org).\n\n',
                text: comment +  footer,
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

var dictionary = {};
titles.forEach(title => {
    dictionary[title.toLowerCase()] = title;
})

var keys = [];
for (var key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
        keys.push(key);
    }
}

// get regex
var str = keys.reduce((prev, curr) => {
    if (prev === '')
        return curr;
    else
        return prev + '|' + curr;
}, '')

var regex = XRegExp(`(${str})\\W+([0-9]+):([0-9]+)`,'i');

// initial fetch to get the name of the latest comment
initialFetchComments();

//then run every 5 seconds after
setInterval(fetchComments, 5000);