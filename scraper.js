const axios = require('axios');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const {URL} = require('url') 

//fetch html from a url 
//i can use axios for this
async function getHTML(url) {
    try {
        const response = await axios.get(url)
        const html = response.data
        return html
    } catch(error){
        console.error(`Hiii Error fetching URL ${url}: ${error.message}`);
        return null
    }
}

//uses cheerio to clean up the html
//nb there is also a cheerio .fromURL method i could prob use but I'll leave axios in for now 
function processHTML(html, baseUrl, linkLimit){
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
    $('.ad, .advertisement').remove();
    $('form').remove();
    $('style').remove();
    $('meta').remove();

    //extract links up to limit
    const links = []

    $('a[href]').each((index, element) => {
        if (links.length >= linkLimit) return false;

         //get value of the href attribute of current element 
         let href = $(element).attr('href');
         if (href) {
             try {
                //handle protocol-relative Urls
                if (href.startsWith('//')){
                    href = 'https:' + href
                }
                //resolve relative Urls against base url 
                 const url = new URL(href, baseUrl);
                 links.push(url.toString());
             } catch (e) {
                 console.log(`Invalid URL: ${href}`);
             }
         }
    })

    //return as an object with properties
    return {processedHTML: $.html(), extractedLinks: links} 
}

//save the output to a file using fs (filesystem) node library
function saveHTML(content, outputDir, filename){
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename)

    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`Saved processed HTML to ${filePath}`)
}


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//calls all the functions to scrape a site, then recursively calls itself to traverse links
async function scrape(url, baseUrl, linkLimit, depth, outputDir, visited = new Set()){

    //if depth is 0, we don't want to traverse anymore, return
    if (visited.has(url)){
        console.log(`skipping url duplicate: ${url}`)
        return;
    } else if (depth === 0){
        console.log(`reached max depth, stopping at url: ${url}`)
        return

    } 

    //add the url so we can track we don't visit the same one multiple times
    visited.add(url)

    console.log(`Scraping URL (depth ${depth}): ${url}`);

    try {
    //get the html
        const html = await getHTML(url)
        if (!html) return;

        //clean up html and get links
        const {processedHTML, extractedLinks} = processHTML(html, baseUrl, linkLimit)

        console.log(`Extracted ${extractedLinks.length} links`);

        //save html to output file based on sanitized url
        if (processedHTML) {
            //define example dir and filename for testing
            const fileName = `${depth}_${url.replace(/[^a-z0-9]/gi, "_")}.html`;
            
            saveHTML(processedHTML, outputDir, fileName)
        }

        if (depth > 1){
            for(let link = 0; link < extractedLinks.length; link++){
                await delay(500)
                await scrape(extractedLinks[link], baseUrl, linkLimit, depth - 1, outputDir, visited)
            }
        
        }
    } catch (error){
        console.error(`Error scraping ${url}: ${error.message}`);

    }
}

//passes parameters into recursive scrape function 
async function main() {
    const url = 'https://www.slatestarcodex.com/';
    const baseUrl = new URL(url).origin;
    const linkLimit = 5;  // Increased from 2 to 5
    const depth = 3;  // Increased from 2 to 3
    const outputDir = './output';

    await scrape(url, baseUrl, linkLimit, depth, outputDir);
}

main() 