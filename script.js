const Api_key = "1d3a0eefa97b499d8fbc4ee93eeb40b7";
const url = "https://newsapi.org/v2/everything?q=";

window.addEventListener('load', () => fetchNews("India"));

function reload() {
    window.location.reload();
}

async function fetchNews(query) {
    try {
        const res = await fetch(`${url}${query}&apiKey=${Api_key}`);
        if (!res.ok) {
            throw new Error(`Network response was not ok: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.articles.length === 0) {
            alert('No articles found');
        } else {
            bindData(data.articles);
        }
    } catch (error) {
        alert('Error fetching news: ' + error.message);
        console.error('Error fetching news:', error);
    }
}

function bindData(articles) {
    const cardsCont = document.getElementById("cards-container");
    const templ_cls = document.getElementById("template_card");

    cardsCont.innerHTML = "";

    articles.forEach((article) => {
        if (!article.urlToImage) return;
        const clone_card = templ_cls.content.cloneNode(true);
        fillDataInCard(clone_card, article);
        cardsCont.appendChild(clone_card);
    });
}

function fillDataInCard(cln_card, article) {
    const nws_img = cln_card.querySelector('#news-img');
    const nws_title = cln_card.querySelector('#news-title');
    const nws_src = cln_card.querySelector('.news-source');
    const nws_descr = cln_card.querySelector('.news-des');

    nws_img.src = article.urlToImage;
    nws_title.innerHTML = article.title;
    nws_descr.innerHTML = article.description;

    const date = new Date(article.publishedAt).toLocaleString("en-UK", {
        timeZone: "Asia/Jakarta"
    });

    nws_src.innerHTML = `${article.source.name} ${date}`;

    cln_card.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
    });
}

let currSelNav = null;

function onNavItemClick(id) {
    fetchNews(id);
    clearSearchBar();
    if (currSelNav) {
        currSelNav.classList.remove("active");
    }
    const navItem = document.getElementById(id);

    navItem.classList.add("active");
    currSelNav = navItem;
}

const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", () => {
    const query = searchText.value;
    if (!query.trim()) {
        alert('Please enter a valid search term');
        return;
    }
    fetchNews(query);
    currSelNav?.classList.remove("active");
    currSelNav = null;
});

searchText.addEventListener("keypress", handleKeyPress);

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        const query = searchText.value;
        if (!query.trim()) {
            alert('Please enter a valid search term');
            return;
        }
        fetchNews(query);
        currSelNav?.classList.remove("active");
        currSelNav = null;
    }
}

function clearSearchBar() {
    searchText.value = '';
}
