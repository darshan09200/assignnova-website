import { getSubCategories, getParams, getCategory, getArticles } from "/firebase.js";

const articlesEl = document.getElementById("articles");

getArticles()
	.then((articles) => {
		if (!articles || articles.length == 0) {
			articlesEl.innerHTML = `<p>No Articles Found</p>`;
			return;
		}
		const params = getParams();
		articlesEl.innerHTML = "";
		articles.forEach((article) => {
			articlesEl.innerHTML += `
				<div class="mt-3">
					<a href="${window.location.pathname}article/${window.location.search}&article=${article.id}" class="mt-3 text-decoration-none">
						<div class="article d-flex p-2 rounded-1">
							<div class="me-2">
								<i class="bi bi-file-text-fill fs-5 text"></i>
							</div>
							<div>
								<h4 class="text-primary h5 fw-normal">${article.title}</h4>
								<p class="m-0 text-body description">
									${article.shortDesc}
								</p>
							</div>
						</div>
					</a>
				</div>
			`;
		});
	})
	.catch(console.log);

const sidebarCategoriesEl = document.getElementById("sidebar-subcategories");
const categoryEl = document.getElementById("subcategory");

getSubCategories()
	.then((categories) => {
		const params = getParams();
		sidebarCategoriesEl.innerHTML = "";
		let categoryFoundFlag = false;
		categories?.forEach((category) => {
			if (category.id == params["sub-category"]) {
				categoryEl.innerHTML = `
					<h2 class="h4 fw-normal my-auto">${category.title}</h2>
				`;
				categoryFoundFlag = true;
			} else {
				sidebarCategoriesEl.innerHTML += `
					<li class="nav-item mb-2" id="${category.id}">
						<a href="${window.location.pathname}${window.location.search}&sub-category=${category.id}" class="nav-link p-0 text-primary">${category.title}</a>
					</li>
				`;
			}
		});
		if (categories?.length == 0 || !categoryFoundFlag) {
			categoryEl.innerHTML = `<h2 class="h4 fw-normal d-inline  my-auto">Articles</h2>`;
			return;
		}
	})
	.catch(console.log);
