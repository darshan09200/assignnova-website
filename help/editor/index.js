// https://codepen.io/xtini/pen/PxvqWB

/*
  Helper Functions
 */
function debounce(fn, delay = 250) {
	let timer;
	return function (...args) {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			fn(...args);
			timer = null;
		}, delay);
	};
}

function $(selector, context = document) {
	return context.querySelector(selector);
}

function $all(selector, context = document) {
	return context.querySelectorAll(selector);
}

const createElement = (tagName, attributes = {}, ...children) => {
	const node = document.createElement(tagName);

	if (attributes) {
		Object.keys(attributes).forEach((key) => {
			if (key === "className") {
				const classes = attributes[key].split(" ");
				classes.forEach((x) => node.classList.add(x));
			} else if (/^data-/.test(key)) {
				const dataProp = key
					.slice(5) // removes `data-`
					.split("-")
					.map((str, i) => (i === 0 ? str : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()))
					.join("");
				node.dataset[dataProp] = attributes[key];
			} else {
				node.setAttribute(key, attributes[key]);
			}
		});
	}

	children.forEach((child) => {
		if (typeof child === "undefined" || child === null) {
			return;
		}
		if (typeof child === "string") {
			node.appendChild(document.createTextNode(child));
		} else {
			node.appendChild(child);
		}
	});

	return node;
};

const editor_plugin = (function () {
	const def = {
		id: "",
		defParagraphSeparator: "p",
		parentSelector: "body",
		actions: {
			bold: {
				type: "strong",
				icon: "bi bi-type-bold",
				format: "inline",
				command: "bold",
			},
			italic: {
				type: "em",
				icon: "bi bi-type-italic",
				format: "inline",
				command: "italic",
			},
			underline: {
				type: "u",
				icon: "bi bi-type-underline",
				format: "inline",
				command: "underline",
			},
			olist: {
				type: "ol",
				icon: "bi bi-list-ol",
				format: "block",
				command: "insertOrderedList",
			},
			ulist: {
				type: "ul",
				icon: "bi bi-list-ul",
				format: "block",
				command: "insertUnorderedList",
			},
			link: {
				type: "a",
				icon: "bi bi-link-45deg",
				format: "inline",
				command: "createLink",
				target: "link-modal",
			},
			image: {
				type: "img",
				icon: "bi bi-card-image",
				format: "block",
				command: "insertImage",
			},
			iframe: {
				type: "iframe",
				icon: "bi bi-film",
				format: "block",
				command: "insertIframe",
				target: "iframe-modal",
			},
		},
		inlineActionKeys: ["bold", "italic", "underline", "link"],
		blockActionKeys: ["olist", "ulist", "image", "iframe"],
	};

	class RichEditor {
		constructor(settings) {
			this.settings = {
				...def,
				...settings,
			};
			this.state = {
				currentSelection: null,
				currentBlock: {
					index: 0,
					type: settings.defParagraphSeparator || def.defParagraphSeparator,
					text: "",
				},
				selectedBlockType: settings.defParagraphSeparator || "p",
			};
			this.keyCodes = {
				BACKSPACE: 8,
				DELETE: 46,
				TAB: 9,
				ENTER: 13,
			};
			this.el = {
				parent: $(settings.parentSelector) || document.body,
				toolbar: $(`${settings.id}__toolbar`) || this.renderToolbar(),
				iframe: $(`#${settings.id}`) || this.renderEditor(),
				HTMLOutput: $(`#${settings.id}__html-output`) || this.renderHTMLOutput(),
			};

			this.showSelectedBlockType = this.showSelectedBlockType.bind(this);
			this.showSelectedInlineStyles = this.showSelectedInlineStyles.bind(this);
			this.renderLinkModal();
			this.renderIFrameModal();
			this.init();
		}

		init() {
			this.el = {
				...this.el,
				doc: $(`#${this.settings.id}`).contentWindow.document,
			};
			const defParaSeparator = this.settings.defParagraphSeparator;

			this.el.doc.head.appendChild(
				createElement("link", {
					href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css",
					rel: "stylesheet",
					integrity: "sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ",
					crossorigin: "anonymous",
				})
			);

			this.el.doc.head.appendChild(
				createElement("script", {
					src: "https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.7/dist/umd/popper.min.js",
					integrity: "sha384-zYPOMqeu1DAVkHiLqWBUTcbYfZ8osu1Nd6Z89ify25QV9guujx43ITvfi12/QExE",
					crossorigin: "anonymous",
				})
			);
			this.el.doc.head.appendChild(
				createElement("script", {
					src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.min.js",
					integrity: "sha384-Y4oOpwW3duJdCWv5ly8SCFYWqFDsfob/3GkgExXKV4idmbt98QcxXYs9UoXAB7BZ",
					crossorigin: "anonymous",
				})
			);
			this.el.doc.head.appendChild(
				createElement(
					"style",
					{
						type: "text/css",
					},
					`
					body{padding-left:16px; padding-right:16px}a{cursor: pointer}iframe{pointer-events: none;}
					`
				)
			);
			this.el.doc.body.setAttribute("contenteditable", "true");
			this.el.doc.execCommand("defaultParagraphSeparator", false, this.settings.defParagraphSeparator);
			this.el.doc.addEventListener(
				"keyup",
				() => {
					this.displayHTML();
				},
				false
			);

			this.el.doc.body.addEventListener("input", () => {
				const firstChild = this.el.doc.body.firstChild;
				const currentNode = this.el.doc.getSelection().anchorNode;
				// When you start editing for a new document by default there is only text sometimes depending on the scenario. So if its text replace it with p tag
				if (!firstChild || firstChild.nodeType !== 3) return;
				const range = document.createRange();
				range.selectNodeContents(firstChild);
				const selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);

				// Replace the block of new selection with p tag
				this.editText("formatBlock", `<${this.settings.defParagraphSeparator}>`);
			});

			this.el.doc.body.addEventListener("keyup", this.showSelectedBlockType);
			this.el.doc.body.addEventListener("mouseup", this.showSelectedBlockType);
			this.el.doc.body.addEventListener("mouseup", this.showSelectedInlineStyles);
			this.el.doc.body.addEventListener("keyup", this.showSelectedInlineStyles);
		}

		showSelectedBlockType(e) {
			const key = e.key || e.keyCode;
			if (
				e.type === "mouseup" ||
				key === "Enter" ||
				key === this.keyCodes.ENTER ||
				key === "Backspace" ||
				key === this.keyCodes.BACKSPACE
			) {
				const selection = this.el.doc.getSelection().anchorNode.parentNode;

				// improve more to go recursive until first parent
				const parentType = selection.parentNode.nodeName.toLowerCase();
				const type = selection.nodeName.toLowerCase();
				$all('.toolbar__btn[data-format="block"]', this.el.toolbar).forEach((btn) => {
					if (btn.dataset.type === type || btn.dataset.type === parentType) {
						btn.classList.remove("btn-secondary");
						btn.classList.add("btn-primary");
					} else {
						btn.classList.remove("btn-primary");
						btn.classList.add("btn-secondary");
					}
				});
			}
		}

		showSelectedInlineStyles(e) {
			const selection = this.el.doc.getSelection();
			const type = selection.anchorNode.parentNode.tagName.toLowerCase();
			if (type === "body") return;
			this.settings.inlineActionKeys.forEach((key) => {
				const command = this.settings.actions[key].command;
				const btn = $(`.toolbar__btn[data-command="${command}"]`);
				if (this.el.doc.queryCommandState(command)) {
					btn.classList.remove("btn-secondary");
					btn.classList.add("btn-primary");
				} else {
					btn.classList.remove("btn-primary");
					btn.classList.add("btn-secondary");
				}
			});
		}

		getCurrentBlock() {
			const selection = this.el.doc.getSelection().anchorNode.parentNode;
			const type = selection.nodeName.toLowerCase();
			if (type === "body" || type === "html") return;
			const children = this.el.doc.body.childNodes;
			let index = 0;
			for (let i = 0; i < children.length; i++) {
				if (children[i] == selection) {
					index = i;
					break;
				}
			}
			const currentBlock = {
				index,
				type,
				text: selection.textContent,
			};
			return currentBlock;
		}

		setState(newState) {
			this.state = {
				...this.state,
				...newState,
			};
		}

		selectTool(e) {
			const target = e.target;
			if (!target.matches(".toolbar__btn")) return;
			const command = target.dataset.command;
			const format = target.dataset.format;
			const type = target.dataset.type;
			const value = target.value;
			const removeFormat = this.el.doc.queryCommandState(command);
			target.classList.toggle("btn-primary");
			target.classList.toggle("btn-secondary");
			switch (format) {
				case "inline":
					if (command === "createLink") {
						// TODO: check if string is URL. If it is, transform it into link. If not, mount link form
						// this.mountFormInsertLink();
					} else {
						this.editText(command, value);
					}
					break;
				case "block":
					if (command == "insertImage") {
						const input = document.createElement("input");
						input.type = "file";
						input.accept = "image/*";
						input.multiple = false;

						input.onchange = (e) => {
							const file = e.target.files[0];

							const selection = this.el.doc.getSelection();
							this.el.doc.body.focus();
							this.editText("insertParagraph");
							this.el.doc.body.focus();

							const content = URL.createObjectURL(file);

							const range = selection.getRangeAt(0);
							range.collapse(true);

							const image = document.createElement("img");
							image.src = content;
							image.style.display = "block";
							image.style.margin = "0 auto";
							image.style.maxWidth = "100%";
							image.style.minWidth = "100%";

							const figure = document.createElement("figure");
							figure.contentEditable = false;
							figure.classList.add("clearfix");
							// figure.style.display = "table";
							// figure.style.clear = "both";
							figure.style.margin = "1rem auto";
							figure.style.minWidth = "50px";
							// figure.style.textAlign = "center";

							figure.appendChild(image);

							range.insertNode(figure);
							range.setStartAfter(figure);
							selection.removeAllRanges();
							selection.addRange(range);

							this.el.doc.body.focus();
							this.editText("insertParagraph");

							selection?.anchorNode?.previousSibling?.childNodes?.forEach((node, index) => {
								if (index !== 0) {
									node?.remove();
								}
							});

							this.el.doc.body.focus();
						};

						input.click();
					} else if (command === "insertIframe") {
					} else if (removeFormat) {
						const selection = this.el.doc.getSelection();
						if (selection && selection.rangeCount) {
							const container = selection.getRangeAt(0).commonAncestorContainer;
							this.unwrap(container, this.settings.defParagraphSeparator);
						}
					} else {
						$all('.toolbar__btn[data-format="block"]', this.el.toolbar).forEach((btn) => {
							if (btn.dataset.type === type) {
								btn.classList.remove("btn-secondary");
								btn.classList.add("btn-primary");
							} else {
								btn.classList.remove("btn-primary");
								btn.classList.add("btn-secondary");
							}
						});
						this.editText(command, value);
						this.setState({ selectedBlockType: type });
						const selection = this.el.doc.getSelection();
						if (selection && selection.rangeCount) {
							const ancestor = selection.getRangeAt(0).commonAncestorContainer;
							const block =
								ancestor.nodeType !== 3
									? ancestor.closest(`${type}`)
									: ancestor.parentNode.closest(`${type}`);
							if (block.parentNode !== this.el.doc.body) {
								this.unwrap(block.parentNode);
							}
						}
					}
					break;
			}
		}

		mountFormInsertLink() {
			const form = this.el.formInsertLink || this.renderFormInsertLink();
			const selection = this.el.doc.getSelection();
			if (selection && selection.rangeCount) {
				const span = document.createElement("span");
				const range = selection.getRangeAt(0);
				range.surroundContents(span);
				form.style.top = span.offsetTop + this.el.iframe.offsetTop - 56 + "px";
				form.style.left = span.offsetLeft + 16 + "px";
				form.classList.remove("is-hidden");
				this.el.doc.body.focus();
			}
		}

		unwrap(container, newChildType = null) {
			const parent = container.parentNode;

			while (container.firstChild) {
				if (newChildType) {
					container.replaceChild(
						createElement(newChildType, null, container.firstChild.textContent),
						container.firstChild
					);
				}
				parent.insertBefore(container.firstChild, container);
			}
			parent.removeChild(container);
			this.displayHTML();
		}

		// TODO: add url form
		editText(command, val = "") {
			const isChanged = this.el.doc.execCommand(command, false, val);
			if (isChanged) {
				this.displayHTML();
			}
			this.el.doc.body.focus();
		}

		displayHTML() {
			this.el.HTMLOutput.innerHTML = this.el.doc.body.innerHTML;
		}

		renderEditor() {
			const editor = createElement("iframe", {
				id: this.settings.id,
				name: this.settings.id,
				className: "rich-editor",
				src: "about:blank",
				target: "_parent",
				title: "rich-text-editor",
			});
			$(this.settings.parentSelector).appendChild(
				createElement("div", { className: "border border-dark-subtle rounded-1 row gx-1" }, editor)
			);
			return editor;
		}

		renderHTMLOutput() {
			const output = createElement("textarea", {
				id: `${this.settings.id}__html-output`,
				className: "html-output border border-dark-subtle form-control",
			});
			$(this.settings.parentSelector).appendChild(createElement("div", { className: "row mt-2 gx-1" }, output));
			return output;
		}

		renderToolbar() {
			const toolbar = createElement("div", {
				id: `${this.settings.id}__toolbar`,
				className: "row gx-1 toolbar my-2",
			});
			const actionKeys = [...this.settings.inlineActionKeys, ...this.settings.blockActionKeys];
			actionKeys.forEach((key) => {
				toolbar.appendChild(
					createElement(
						"div",
						{
							className: "col col-md-auto",
						},
						createElement(
							"button",
							{
								className: "toolbar__btn btn btn-secondary my-1",
								type: "button",
								"data-command": this.settings.actions[key].command,
								"data-type": this.settings.actions[key].type,
								"data-format": this.settings.actions[key].format,
								value: this.settings.actions[key].value || "",
								role: "button",
								...(this.settings.actions[key].target
									? {
											"data-bs-toggle": "modal",
											"data-bs-target": `#${this.settings.actions[key].target}`,
									  }
									: {}),
							},
							createElement("i", {
								className: this.settings.actions[key].icon,
							})
						)
					)
				);
			});
			toolbar.addEventListener("click", (e) => {
				e.preventDefault();
				this.selectTool(e);
			});
			$(this.settings.parentSelector).appendChild(toolbar);
			return toolbar;
		}

		renderFormInsertLink() {
			const btnClose = createElement(
				"button",
				{
					className: "toolbar__form-btn",
					type: "button",
				},
				createElement("box-icon", {
					className: "box-icon",
					name: "x",
				})
			);
			const input = createElement("input", {
				className: "toolbar__submit",
				type: "submit",
				name: "url",
				value: "Insert Link",
			});
			const form = createElement(
				"form",
				{
					className: "toolbar__form--inline toolbar__form--link is-hidden",
					name: "insertLink",
				},
				createElement("input", {
					className: "toolbar__input toolbar__input--link",
					type: "text",
					name: "url",
					id: "url",
					placeholder: "Enter URL...",
				}),
				input,
				btnClose
			);
			btnClose.addEventListener("click", (e) => {
				form.classList.add("is-hidden");
				if (input.value !== "") {
				}
			});
			input.addEventListener("blur", (e) => {
				let url = e.currentTarget.value;
				if (!/^http:\/\//.test(url)) {
					url = "http://" + url;
				}
				e.currentTarget.value = url;
			});
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				const input = $(".toolbar__input--link", e.currentTarget);
				let url = input.value;
				if (!/^http:\/\//.test(url)) {
					url = "http://" + url;
				}
				e.currentTarget.classList.add("is-hidden");
				e.currentTarget.reset();
				this.editText("createLink", url);
				const selection = this.el.doc.getSelection();
				this.unwrap(selection.anchorNode.parentNode.closest("span"));
			});
			this.el = {
				...this.el,
				formInsertLink: form,
			};
			this.el.parent.appendChild(form);
			return form;
		}

		renderLinkModal() {
			const modal = document.createElement("div");
			modal.classList.add("modal");
			modal.classList.add("fade");
			modal.id = "link-modal";
			// modal.setAttribute("aria-labelledby", "exampleModalLabel");
			modal.setAttribute("aria-hidden", true);
			// modal.setAttribute("data-bs-backdrop", "static");
			modal.innerHTML = `<div class="modal-dialog">
				<div class="modal-content">
					<form id="insert-link">
						<div class="modal-header">
							<h5 class="modal-title">Insert Link</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<label for="link-url" class="form-label">Link</label>
							<input type="url" validate required class="form-control" name="link-url" id="link-url">
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="submit" class="btn btn-primary">Insert Link</button>
						</div>
					</form>
				</div>
			</div>`;

			$(this.settings.parentSelector).appendChild(modal);

			$("#insert-link").addEventListener("submit", (e) => {
				e.preventDefault();
				const input = $("#link-url", e.currentTarget);
				let url = input.value;

				this.el.doc.body.focus();
				this.editText("createLink", url);
				bootstrap.Modal.getInstance(modal).hide();
			});
		}

		renderIFrameModal() {
			const modal = document.createElement("div");
			modal.classList.add("modal");
			modal.classList.add("fade");
			modal.id = "iframe-modal";
			// modal.setAttribute("aria-labelledby", "exampleModalLabel");
			modal.setAttribute("aria-hidden", true);
			modal.setAttribute("data-bs-backdrop", "static");
			modal.innerHTML = `<div class="modal-dialog">
				<div class="modal-content">
					<form id="insert-iframe">
						<div class="modal-header">
							<h5 class="modal-title">Add Media</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<label for="iframe-url" class="form-label">Media Url</label>
							<input type="url" validate required class="form-control" name="iframe-url" id="iframe-url">
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="submit" class="btn btn-primary">Insert Iframe</button>
						</div>
					</form>
				</div>
			</div>`;

			$(this.settings.parentSelector).appendChild(modal);

			$("#insert-iframe").addEventListener("submit", (e) => {
				e.preventDefault();
				const input = $("#iframe-url", e.currentTarget);
				let url = input.value;
				e.currentTarget.reset();

				const selection = this.el.doc.getSelection();

				this.el.doc.body.focus();
				this.editText("insertParagraph");

				this.el.doc.body.focus();

				const range = selection.getRangeAt(0);
				range.collapse(true);

				const wrapperDiv = document.createElement("div");
				wrapperDiv.style.margin = "0 auto";
				const div = document.createElement("div");
				div.style.position = "relative";
				div.style.height = "0";
				div.style.paddingBottom = "56.2493%";

				const figure = document.createElement("figure");
				figure.contentEditable = false;
				figure.style.clear = "both";
				figure.style.margin = "1rem auto";
				figure.style.minWidth = "15em";

				figure.appendChild(wrapperDiv);
				wrapperDiv.appendChild(div);

				const iframe = document.createElement("iframe");
				iframe.style.position = "absolute";
				iframe.style.width = "100%";
				iframe.style.height = "100%";
				iframe.style.top = "0";
				iframe.style.left = "0";
				iframe.src = url;
				iframe.allow = "autoplay; encrypted-media";
				iframe.setAttribute("allowFullScreen", "");

				div.appendChild(iframe);

				range.insertNode(figure);
				range.setStartAfter(figure);
				selection.removeAllRanges();
				selection.addRange(range);

				this.editText("insertParagraph");
				// this.el.doc.body.focus();

				selection?.anchorNode?.previousSibling?.childNodes?.forEach((node, index) => {
					if (index !== 0) {
						node?.remove();
					}
				});

				this.el.doc.body.focus();
				bootstrap.Modal.getInstance(modal).hide();
			});
		}
	}

	return RichEditor;
})();

const editor = new editor_plugin({
	id: "richEditor",
	parentSelector: ".editor-container",
});

import { getParams, getArticles, getArticle, saveArticle } from "/firebase.js";

getArticle().then((article) => {
	editor.el.doc.body.innerHTML = article?.content || "";
	editor.displayHTML();
});

document.getElementById("save-content").addEventListener("click", () => {
	const description = editor.el.doc.body.innerText.replace(/\n\s*\n/g, " ").trim();
	if (!description || description.length == 0) {
		alert("Please enter something to save");
		return;
	}
	const content = editor.el.doc.body.innerHTML;

	saveArticle({ content, shortDesc: description });
});
