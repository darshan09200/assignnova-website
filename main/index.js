const activateNavLink = () => {
	const refreshLink = () => {
		const { hash, pathname } = window.location;
		document.querySelectorAll(`#topnav > li > a`).forEach((el) => el.classList.remove("active"));
		if (pathname === "/" || pathname == "/index.html") {
			document.querySelector(`#topnav > li > a[href="/#${hash.replace("#", "")}"]`)?.classList.add("active");
		} else {
			const newPathName = pathname.split("/");
			newPathName.pop();
			document.querySelector(`#topnav > li > a[href="${newPathName.join("/")}"]`)?.classList.add("active");
		}
	};

	refreshLink();

	window.addEventListener("hashchange", function () {
		refreshLink();
	});
};

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

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker
			.register("/serviceWorker.js")
			.then((res) => console.log("service worker registered"))
			.catch((err) => console.log("service worker not registered", err));
	});
}

const slider = document.getElementById("noOfEmp");
const textinput = document.getElementById("noOfEmpInp");
const priceEl = document.getElementById("price");

slider.oninput = (e) => {
	textinput.value = e.target.value;
	recalculate()
};

textinput.addEventListener("input", (e) => {
	slider.value = e.target.value;
	recalculate();
});

const recalculate = () => {
	const noOfEmp = parseInt(slider.value);
	let price = 0;
	if (noOfEmp < 51) {
		price = noOfEmp * 4;
	} else if (noOfEmp < 251) {
		price = 50 * 4 + (noOfEmp - 50) * 3.8;
	} else {
		price = 50 * 4 + 150 * 3.8 + (noOfEmp - 150) * 3.6;
	}
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	});
	priceEl.innerHTML = formatter.format(price);
};

slider.value = 5
textinput.value = 5
recalculate()
