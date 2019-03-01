

// let characters = [];

var characters = [];
charId = 1;

async function getAllCharacters() {
    let AtoZ = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let startUrl = "https://simpsons.fandom.com/wiki/Category:Characters?from="
    AtoZ.forEach(page => {
        getCharactersOnPage(`${startUrl}${page}`)
    })
}

async function getCharactersOnPage(url = "https://simpsons.fandom.com/wiki/Category:Characters?from=b") {
    // no category pages, filter them out. return links
    let cPageBlob = await fetch(url).then(d => d.text().then(r => r))
    let cPageDom = new DOMParser().parseFromString(cPageBlob, "text/html")
    let charLinks = [...cPageDom.querySelectorAll("a.category-page__member-link")].filter(cat => cat["title"].indexOf("Category:") === -1).map(a => a["href"])
    asyncForEach(charLinks, async (charLink) => getCharacterInfo(charLink).then(characterInfo => { if (characterInfo !== undefined) { characters.push(characterInfo) } }))
}

async function getCharacterInfo(url) {
    charId++;
    let char = {}
    let cBlob = await fetch(url).then(d => d.text().then(r => r))
    let cDom = new DOMParser().parseFromString(cBlob, "text/html")
    char.Id = charId
    // Main photo
    char.Picture = await propFromSelector(cDom, ".pi-image-thumbnail", "src")
    // Character name
    char.Name = await propFromSelector(cDom, "h1.page-header__title")
    char.Bio = await getBio(cDom)
    let quotes = await getQuotes(cDom)
    if (quotes) { char.Quotes = quotes }
    characters.push(char)
    console.log(char.Name)
}

async function getBio(dom) {
    let bio = "";
    [...dom.querySelectorAll("#mw-content-text > p")].forEach(p => {
        let t = p["innerText"].replace(/ *\[[^\]]*]/g, '');
        bio = `${bio}\n${t}`
    })
    return bio.trim();
}

async function getQuotes(dom) {
    let quotes = [];
    [...dom.querySelectorAll("#mw-content-text > dl:first-of-type i")].forEach(quote => {
        if (quote) {
            if (quote.innerText.length) {
                quotes.push(quote.innerText)
            }
        }
    })
    return quotes;
}

// helper function
async function propFromSelector(dom, selector, prop) {
    let props = dom.querySelectorAll(selector);
    // console.log(props);
    if (!props || props.length === 0) { return ""; }
    if (props.length === 1) {
        if (prop) { return props[0][prop] ? props[0][prop] : "" }
        else { return props[0].innerText.trim() }
    }
    // multiple, return an array
    else {
        let allProps = [];
        [...props].forEach(p => {
            if (prop) { if (p[prop]) { allProps.push(p[prop]) } } else {
                allProps.push(p.innerText.trim())
            }
        });
    }
}
// i like async foreach
async function asyncForEach(array, callback) { for (let index = 0; index < array.length; index++) { await callback(array[index], index, array); } }