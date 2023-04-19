import { getParams, getCategories, getTicket } from "/firebase.js";

getTicket().then((ticket) => {
	if (!ticket) {
		document.getElementById("content").innerHTML = "<p>No Ticket Found</p>"
	}

	document.getElementById("email").innerHTML = ticket.email
	document.getElementById("category").innerHTML = ticket.category;
	document.getElementById("description").innerHTML = ticket.description;

	refreshUI(ticket.files)
});


const refreshUI = (attachmentFiles) => {
	const fileList = document.getElementById("file-list");

	fileList.innerHTML = "";

	for (let i = 0; i < attachmentFiles.length; i++) {
		const file = attachmentFiles[i];
		const fileElement = document.createElement("div");
		fileElement.innerHTML = `
			<div class="border rounded-1 mt-2">
				<div class="p-2 d-flex justify-content-between align-items-center">
					<span> <i class="bi bi-paperclip me-1"></i>${file} </span>
				</div>
			</div>
		`;
		fileList.appendChild(fileElement);
	}
};


const sidebarCategoriesEl = document.getElementById("sidebar-categories");

getCategories()
	.then((categories) => {
		const params = getParams();
		sidebarCategoriesEl.innerHTML = "";
		categories?.forEach((category) => {
			sidebarCategoriesEl.innerHTML += `
				<li class="nav-item mb-2" id="${category.id}">
					<a href="/article-categories/?category=${category.id}" class="nav-link p-0 text-primary">${category.title}</a>
				</li>`;


		});
	})
	.catch(console.log);
