import { getParams, getCategories, getNewSupport, uploadFile } from "/firebase.js";

const dropZone = document.getElementById("drop-zone");
const fileList = document.getElementById("file-list");

const supportRef = getNewSupport();
const attachmentFiles = [];

dropZone.ondragover = function () {
	dropZone.classList.add("border-primary");
	return false;
};

dropZone.ondragleave = function () {
	dropZone.classList.remove("border-primary");
	return false;
};

const attachment = document.getElementById("attachment");
attachment.addEventListener("change", function () {
	let files = attachment.files;
	let actualFiles = [...Object.values(files).filter((v) => typeof v === "object")];
	attachmentFiles.push(...actualFiles);
	refreshUI();
	attachmentFiles.forEach((file, index) => {
		if (!file.task) {
			uploadFile(index, file, supportRef.id).then(([task, storageRef]) => {
				const progressEl = document.getElementById("file-progress-" + index);
				attachmentFiles[index].task = task;
				task.on(
					"state_changed",
					(snapshot) => {
						const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						progressEl?.setAttribute?.("aria-valuenow", percentage);
						if (progressEl?.firstElementChild) progressEl.firstElementChild.style.width = percentage + "%";
					},
					console.log,
					() => {
						progressEl.remove();
						attachmentFiles[index].path = storageRef.fullPath;
						console.log(attachmentFiles);
					}
				);
			});
		}
	});
});

const refreshUI = () => {
	fileList.innerHTML = "";

	for (let i = 0; i < attachmentFiles.length; i++) {
		const file = attachmentFiles[i];
		if(file.isHidden) continue
		const fileElement = document.createElement("div");
		fileElement.innerHTML = `
			<div class="border rounded-1 mt-2">
				<div class="p-2 d-flex justify-content-between align-items-center">
					<span> <i class="bi bi-paperclip me-1"></i>${file.name} </span>
					<i class="bi bi-x-circle" onclick="onRemovePress(${i})"></i>
				</div>
				<div
					class="progress"
					role="progressbar"
					aria-label="Animated striped example"
					aria-valuenow="75"
					aria-valuemin="0"
					aria-valuemax="100"
					style="height: 5px"
					id="file-progress-${i}"
				>
					<div
						class="progress-bar progress-bar-striped progress-bar-animated"
						style="width: 75%"
					></div>
				</div>
			</div>
		`;
		fileList.appendChild(fileElement);
	}
};

window.onRemovePress = (index) => {
	const file = attachmentFiles[index];
	file?.task?.cancel();
	file.isHidden = true
	refreshUI();
};

const sidebarCategoriesEl = document.getElementById("sidebar-categories");
const categoryList = document.getElementById("category");

getCategories()
	.then((categories) => {
		const params = getParams();
		sidebarCategoriesEl.innerHTML = "";
		categoryList.innerHTML = "";
		categories?.forEach((category) => {
			sidebarCategoriesEl.innerHTML += `
				<li class="nav-item mb-2" id="${category.id}">
					<a href="/article-categories/?category=${category.id}" class="nav-link p-0 text-primary">${category.title}</a>
				</li>`;

			categoryList.innerHTML += `
				<option value="${category.title}">${category.title}</option>
			`;
		});
	})
	.catch(console.log);



document.getElementById("support").addEventListener("submit", (e) => {
	e.preventDefault()
	supportRef.set({
		email: document.getElementById("email").value,
		category: document.getElementById("category").value,
		description: document.getElementById("description").value,
		files: attachmentFiles.filter((f) => !f.isHidden).map((f) => f.path),
	})
	.finally(()=>{
		window.location.href = "/ticket/?id="+supportRef.id;

	})
});
