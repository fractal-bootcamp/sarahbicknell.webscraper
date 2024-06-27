const axios = require('axios');
const cheerio = require('cheerio')

//fetch html from a url 
//i can use axios for this
async function getHTML(url) {
    try {
        const response = await axios.get(url)
        const html = response.data
        return html
    } catch(error){
        console.log("Error fetching URL: ", error)
    }
    
}

function processHTML(html){
    const $ = cheerio.load(html)
    //pass the raw html to cheerio's load method
    //$ returns a cheerio object similar to an array of DOM elements

    //clean the html of parts we don't want 
    $('script').remove();
    $('.vector-header').remove();
    $('nav').remove();
    $('#p-lang-btn').remove();
    $('.infobox').remove();
    $('link[rel="stylesheet"]').remove();

    return $.html() 

}

async function scrape(){
    const url = 'https://novalinium.com/'
    const html = await getHTML(url)
    const processedHTML = processHTML(html)
    console.log(processedHTML)
}

scrape() 