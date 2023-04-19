import { getParams, getArticles, getArticle } from "/firebase.js";

const articleEl = document.getElementById("article");

getArticle()
	.then((article) => {
		if (!article) {
			articleEl.innerHTML = `<p>No Article Found</p>`;
			return;
		}
		articleEl.innerHTML = article.content || "";
	})
	.catch(() => {
		console.log("inside");
		articleEl.innerHTML = `<p>No Article Found</p>`;
	});

const sidebarArticlesEl = document.getElementById("sidebar-articles");
const articleTitleEl = document.getElementById("article-title");

getArticles(5)
	.then((articles) => {
		const params = getParams();
		sidebarArticlesEl.innerHTML = "";
		let articleFoundFlag = false;
		articles?.forEach((article) => {
			if (article.id == params.article) {
				articleTitleEl.innerHTML = `
					<h2 class="fw-normal my-auto">
						${article.title}
						<a href="/editor/${window.location.search}" class="btn btn-sm text-primary">Edit</a>
					</h2>
				`;
				articleFoundFlag = true;
			} else {
				sidebarArticlesEl.innerHTML += `
					<li class="nav-item mb-2" id="${article.id}">
						<a href="${window.location.pathname}${window.location.search}&article=${article.id}" class="nav-link p-0 text-primary">${article.title}</a>
					</li>
				`;
			}
		});
		if (articles?.length == 0 || !articleFoundFlag) {
			articleTitleEl.innerHTML = `<h2 class="h4 fw-normal d-inline  my-auto">Article</h2>`;
			return;
		}
	})
	.catch(console.log);
