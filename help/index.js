

function loadImports() {
	var includes = document.querySelectorAll("[data-include]");
	includes.forEach((el) => {
		var file = "/" + el.dataset["include"] + ".html";

		fetch(file)
			.then((data) => data.text())
			.then((data) => {
				el.innerHTML = data;
			});
	});
}

loadImports();

function createBreadcrumbs() {
	const breadcrumb = `<nav
		style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='%236c757d'/%3E%3C/svg%3E&#34;);"
		aria-label="breadcrumb"
	>
		<ol class="breadcrumb">
			<li class="breadcrumb-item">
				<a href="#">Home</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">
				Library
			</li>
		</ol>
	</nav>`;
}

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker
			.register("/serviceWorker.js")
			.then((res) => console.log("service worker registered"))
			.catch((err) => console.log("service worker not registered", err));
	});
}

import { getCategories, getParams, getCategory, getSubCategory, getArticle } from "/firebase.js";

if (window.location.pathname === "/") {
	const categoriesEl = document.getElementById("article-categories");

	getCategories()
		.then((categories) => {
			categoriesEl.innerHTML = "";
			categories.forEach((category) => {
				console.log(category);
				categoriesEl.innerHTML += `
					<div class="col-12 col-md-6 col-lg-4 text-center" id="${category.id}">
						<a href="/article-categories/?category=${category.id}" class="text-decoration-none text-body">
							<div class="border border-dark-subtle rounded-1 py-4 m-2">
								<div class="mb-2"><i class="bi bi-${category.icon} display-4"></i></div>
								<h4 class="fw-normal">${category.title}</h4>
							</div>
						</a>
					</div>`;
			});
		})
		.catch(console.log);
} else {
	const params = getParams();
	console.log(params);
	const breadcrumbsEl = document.getElementById("breadcrumbs");
	const promises = [];
	if (params.category) {
		promises.push(getCategory());
		if (params["sub-category"]) {
			promises.push(getSubCategory());
			if (params.article) {
				promises.push(getArticle());
			}
		}
	}

	Promise.all(promises)
		.then((response) => {
			if (response.length > 0) {
				breadcrumbsEl.innerHTML = `
					<li class="breadcrumb-item">
						<a class="link-body-emphasis text-decoration-none" href="/">Home</a>
					</li>
				`;
				if (response.length > 1) {
					breadcrumbsEl.innerHTML += `
					<li class="breadcrumb-item">
						<a class="link-body-emphasis text-decoration-none" href="/article-categories/?category=${response[0].id}">${
						response[0].title || "Category"
					}</a>
					</li>
				`;
					if (response.length > 2) {
						breadcrumbsEl.innerHTML += `
							<li class="breadcrumb-item">
								<a class="link-body-emphasis text-decoration-none" href="/article-categories/articles/?category=${
									response[0].id
								}&sub-category=${response[1].id}">${response[1]?.title || "Subcategory"}</a>
							</li>
						`;

						if (response.length > 3) {
							breadcrumbsEl.innerHTML += `
							<li class="breadcrumb-item">
								<a class="link-body-emphasis text-decoration-none" href="/article-categories/articles/?category=${
									response[0].id
								}&sub-category=${response[1].id}&article=${response[2].id}">${
								response[2]?.title || "Article"
							}</a>
							</li>
						`;
						} else {
							breadcrumbsEl.innerHTML += `
								<li class="breadcrumb-item active" aria-current="page">${response[2]?.title || "Article"}</li>
							`;
						}
					} else {
						breadcrumbsEl.innerHTML += `
						<li class="breadcrumb-item active" aria-current="page">${response[1]?.title || "Subcategory"}</li>
					`;
					}
				} else {
					breadcrumbsEl.innerHTML += `
					<li class="breadcrumb-item active" aria-current="page">${response[0].title || "Category"}</li>
				`;
				}
			}
		})
		.catch(console.log);
}
