require('dotenv').config()
let snoowrap = require('snoowrap');
let XRegExp = require('xregexp');
let titles = require('./titles.json');

const subReddit = 'test'; //'judaism';

const r = new snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN
});

let dictionary = {};
titles.forEach(title => {
    dictionary[title.toLowerCase()] = title;
})


let keys = [];
for (var key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
        keys.push(key);
    }
}

// get regex
let str = keys.reduce((prev, curr) => {
    if (prev === '')
        return curr;
    else
        return prev + '|' + curr;
}, '')

let regex = XRegExp(`(${str})\\W+([0-9]+):([0-9]+)`,'i');

const processComment = comment => {
    // console.log(comment.author.name);
    // return;

    // get the id of the comment. look for citations. 
    // if there are citations in the comment, add the comment id to a mongo
    // collection of comments with citations where the key is the comment id and
    // the data is whether it has been replied to. Then add the citations to another
    // collection where data includes the comment id, book,
    // chapter, and verse of the citation.

    // later, when we have an app that is processing those comments, it will query all
    // unanswered comments, and iterate over them, answering them one at a time.

    if (comment.author.name === 'TorahBot')
        return;

    let results = [];
    XRegExp.forEach(comment.body, regex, (match, i) => {
        var book = dictionary[match[1].toLowerCase()].replace(/ /g, '_');
        results.push({
            book: book,
            chapter: match[2],
            verse: match[3]
        })
    });

    if (results.length > 0) {
        console.log("found " + results.length + " citations for comment " + comment.id);

        // add comment to collection of comments in mongodb

        // add citations to collection of citations in mongodb
    } else {
        console.log("no results found for comment " + comment.id)
    }
}

const processComments = comments => {
    comments.forEach(processComment);
}

r.getSubreddit(subReddit).getNewComments({limit:100}).then(processComments);
