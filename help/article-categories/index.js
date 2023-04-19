import { getSubCategories, getParams, getCategories, getCategory } from "/firebase.js";

const subCategoriesEl = document.getElementById("article-sub-categories");

getSubCategories()
	.then((subCategories) => {
		if (!subCategories || subCategories?.length == 0) {
			subCategoriesEl.innerHTML = `<p>No Sub Categories Found</p>`;
			return;
		}
		const params = getParams();
		subCategoriesEl.innerHTML = "";
		subCategories.forEach((category) => {
			subCategoriesEl.innerHTML += `
			<div class="mt-3" id="${category.id}">
				<a href="${window.location.pathname}articles/${window.location.search}&sub-category=${category.id}" class="mt-3 text-decoration-none">
					<div class="border border-dark-subtle rounded-1 py-3 px-4 article-category">
						<h4 class="text-primary h5 fw-normal">${category.title}</h4>
						<p class="m-0 text-body">${category.description}</p>
					</div>
				</a>
			</div>`;
		});
	})
	.catch(console.log);

const sidebarCategoriesEl = document.getElementById("sidebar-categories");
const categoryEl = document.getElementById("category");

getCategories()
	.then((categories) => {
		const params = getParams();
		sidebarCategoriesEl.innerHTML = "";
		let categoryFoundFlag = false;
		categories?.forEach((category) => {
			if (category.id == params.category) {
				categoryEl.innerHTML = `
					<i class="bi bi-${category.icon} display-6"></i>
					<h2 class="h4 fw-normal d-inline ms-2 my-auto">${category.title}</h2>
				`;
				categoryFoundFlag = true;
			} else {
				sidebarCategoriesEl.innerHTML += `
			<li class="nav-item mb-2" id="${category.id}">
				<a href="/article-categories/?category=${category.id}" class="nav-link p-0 text-primary">${category.title}</a>
			</li>`;
			}
		});
		if (categories?.length == 0 || !categoryFoundFlag) {
			categoryEl.innerHTML = `<h2 class="h4 fw-normal d-inline  my-auto">Subcategory</h2>`;
			return;
		}
	})
	.catch(console.log);
