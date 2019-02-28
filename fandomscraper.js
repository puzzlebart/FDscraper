

// let characters = [];

var characters = [];

async function getAllCharacters() {
    let AtoZ = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let startUrl = "https://simpsons.fandom.com/wiki/Category:Characters?from="
    AtoZ.forEach(char => {
        getCharactersOnPage(`${startUrl}${char}`)
    })
}

async function getCharactersOnPage(url = "https://simpsons.fandom.com/wiki/Category:Characters?from=b") {
    // no category pages, filter them out. return links
    let cPageBlob = await fetch(url).then(d => d.text().then(r => r))
    let cPageDom = new DOMParser().parseFromString(cPageBlob, "text/html")
    let charLinks = [...cPageDom.querySelectorAll("a.category-page__member-link")].filter(cat => cat["title"].indexOf("Category:") === -1).map(a => a["href"])
    asyncForEach(charLinks, async (charLink) => getCharacterInfo(charLink)
        .then(characterInfo => {
            if (characterInfo !== undefined) { 
                characters.push(characterInfo) }
            }))
}

async function getCharacterInfo(url) {
    let char = {}
    let cBlob = await fetch(url).then(d => d.text().then(r => r))
    let cDom = new DOMParser().parseFromString(cBlob, "text/html")
    // Main photo
    char.Picture = await propFromSelector(cDom, ".pi-image-thumbnail", "src")
    // Character name
    char.Name = await propFromSelector(cDom, "h1.page-header__title")
    char.Bio = await getBio(cDom)
    characters.push(char)
}

async function getBio(dom) {
    let bioHeader = dom.querySelectorAll("#Biography")[0]
    if (bioHeader) {
        let bioEl = bioHeader.parentElement.nextElementSibling.nextElementSibling;
        if (bioEl) {
            return bioEl["innerText"].trim();
        } else return "";
    } else return "";
}

// helper function
async function propFromSelector(dom, selector, prop) {
    let props = dom.querySelectorAll(selector);
    // console.log(props);
    if (!props || props.length === 0) {
        // console.log("no prop here")
        return "";
    }
    //single prop
    if (props.length === 1) {
        // console.log("single prop here")
        if (prop) {
            // console.log(`getting prop ${props[0].prop}`)
            return props[0][prop] ? props[0][prop] : ""
        }
        else {
            // innerText is default
            return props[0].innerText.trim()
        }
    }
    // multiple, return an array
    else {
        // console.log("multiple props!")
        let allProps = [];
        [...props].forEach(p => {
            if (prop) {
                if (p[prop]) { allProps.push(p[prop]) }
            } else {
                allProps.push(p.innerText.trim()) // innerText is default 
            }
        });
    }
}
// i like async foreach
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}