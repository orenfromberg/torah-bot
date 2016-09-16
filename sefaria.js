require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = 'http://www.sefaria.org/api'

var sefaria = {

    getText: function (text, chapter, verse) {
        return fetch(`${url}/texts/${text}.${chapter}.${verse}?context=0&commentary=0`)
            .then(response => {
                if (response.status >= 400) {
                    console.log("Bad response");
                }
                return response.json();
            })
            .then(text => {
                return text;
            })
            .catch(error => {
                console.log("ERROR: " + error);
            })
    },

    getTitles: function () {
        return fetch(`${url}/index/titles`)
            .then(response => {
                if (response.status >= 400) {
                    console.log("Bad response");
                }
                return response.json();
            })
            .then(titles => {
                return titles;
            })
            .catch(error => {
                console.log("ERROR: " + error);
            })
    }
}

module.exports = sefaria;