

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
    char.Gender = await getGender(cDom)
    char.Dead = await isDead(cDom)
    char.Occupation = await getJob(cDom)
    let quotes = await getQuotes(cDom)
    if (quotes) { char.Quotes = quotes }
    let photos = await getPhotos(url)
    if (photos) { char.Photos = photos }
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

async function isDead(dom) { return dom.querySelectorAll("img[data-image-key='Deceased.png']").length > 0 }

async function getJob(dom) {
    let jobNode = dom.querySelector("div[data-source='job'] > div")
    if (jobNode) {
        return jobNode.innerText.trim()
    }
}

async function getGender(dom) {
    // returns F, M or N/A
    let isFemale = dom.querySelectorAll("img[data-image-key='Female.png']").length
    let isMale = dom.querySelectorAll("img[data-image-key='Male.png']").length
    if (isFemale == isMale) { return "N/A" }
    return isFemale > isMale ? "F" : "M" // Hahaha look at this shit
}

async function getPhotos(url) {
    let galleryUrl = `${url}/Gallery`
    let gBlob = await fetch(galleryUrl).then(d => d.text().then(r => r))
    let gDom = new DOMParser().parseFromString(gBlob, "text/html")
    let imgs = [...gDom.querySelectorAll(".wikia-gallery-item a img")]
        .map(img => img.getAttribute("data-src"))
        .filter(i => i)
    console.log(`got ${imgs.length} images`)
    return imgs.length ? imgs : null;
}

async function getQuotes(dom) {
    let quotes = [];
    [...dom.querySelectorAll("#mw-content-text > dl:first-of-type i")].forEach(quote => {
        if (quote) { if (quote.innerText.length) { quotes.push(quote.innerText) } }
    })
    return quotes;
}

// helper function
async function propFromSelector(dom, selector, prop) {
    let props = dom.querySelectorAll(selector);
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