var sefaria = require('./sefaria.js');

// the question:
// given an array of verses, fetch all the verses from sefaria
// and format the output into one text message to be sent back
// as a reddit comment.

// I think the way to do this is with a generator.
// But I am not sure.

// write a generator that takes an array of verses and then
// yields out promises to fetch those verses from sefaria.

const psukim = [
    { 
        book: 'Genesis', 
        chapter: 1, 
        verse: 1
    },
    { 
        book: 'Exodus', 
        chapter: 1, 
        verse: 1
    },
    { 
        book: 'Leviticus', 
        chapter: 1, 
        verse: 1
    },
    { 
        book: 'Fake', 
        chapter: 1, 
        verse: 1
    },
    { 
        book: 'Numbers', 
        chapter: 1, 
        verse: 1
    },
    { 
        book: 'Deuteronomy', 
        chapter: 1, 
        verse: 1
    }    
]

var promises = psukim.map(psuk => {
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

// console.log(promises)

Promise.all(promises)
    .then(results => {
        results.forEach(item => {
            // generate and send comment here.
            console.log(item);
        })
    })
    .catch(error => {
        console.log(error);
    });