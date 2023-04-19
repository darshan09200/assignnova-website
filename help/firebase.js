const { initializeApp } = firebase;

const firebaseConfig = {
	apiKey: "AIzaSyDP7oReCvzqncISxD2kWq2IforlvvRd6Nc",
	authDomain: "assignnova.firebaseapp.com",
	projectId: "assignnova",
	storageBucket: "assignnova.appspot.com",
	messagingSenderId: "426429803905",
	appId: "1:426429803905:web:fce1b7403672b953c00c80",
	measurementId: "G-NJCFXRTMH0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = firebase.analytics();

const db = firebase.firestore();
db.enablePersistence().catch((err) => {
	console.log(err);
	if (err.code == "failed-precondition") {
		// Multiple tabs open, persistence can only be enabled
		// in one tab at a a time.
		// ...
	} else if (err.code == "unimplemented") {
		// The current browser does not support all of the
		// features required to enable persistence
		// ...
	}
});

export const getParams = () =>
	new Proxy(new URLSearchParams(window.location.search), {
		get: (searchParams, prop) => searchParams.get(prop),
	});

let categories = null;

export const getCategories = () => {
	if (categories) return Promise.resolve(categories);
	let articleRef = db.collection("articles");
	return articleRef.get().then((articles) => {
		categories = articles.docs.map((doc) => {
			return { ...doc.data(), id: doc.id };
		});
		return categories;
	});
};

let category = null;

export const getCategory = () => {
	const params = getParams();
	if (!params.category) return Promise.resolve();

	if (category) return category;
	if (categories) {
		category = categories.find((c) => c.id === params.category);
		if (category) return category;
	}
	let categoryRef = db.collection("articles").doc(params.category);
	return categoryRef.get().then((snap) => {
		if (snap.exists) category = { id: snap.id, ...snap.data() };
		return category || {};
	});
};

let subCategories = null;

export const getSubCategories = () => {
	const params = getParams();
	if (!params.category) return Promise.resolve();

	if (subCategories) return Promise.resolve(subCategories);

	if (!params?.category) return Promise.resolve([]);
	const articleRef = db.collection("articles").doc(params?.category).collection("sub-category");
	return articleRef.get().then((articles) => {
		subCategories = articles.docs.map((doc) => {
			return { ...doc.data(), id: doc.id };
		});
		return subCategories;
	});
};

let subCategory = null;

export const getSubCategory = () => {
	const params = getParams();
	if (!params.category || !params["sub-category"]) return Promise.resolve();

	if (subCategory) return subCategory;

	if (subCategories) {
		subCategory = subCategories.find((c) => c.id === params["sub-category"]);
		if (subCategory) return subCategory;
	}
	let categoryRef = db
		.collection("articles")
		.doc(params.category)
		.collection("sub-category")
		.doc(params["sub-category"]);
	return categoryRef.get().then((snap) => {
		if (snap.exists) subCategory = { id: snap.id, ...snap.data() };
		return subCategory || {};
	});
};

let articles = null;

export const getArticles = (limit) => {
	const params = getParams();
	if (!params.category || !params["sub-category"]) return Promise.resolve();

	if (articles) return Promise.resolve(articles);

	if (!params?.category) return Promise.resolve([]);
	let articleRef = db
		.collection("articles")
		.doc(params?.category)
		.collection("sub-category")
		.doc(params?.["sub-category"])
		.collection("article");
	if (limit) {
		articleRef = articleRef.limit(limit);
	}
	return articleRef.get().then((articles) => {
		articles = articles.docs.map((doc) => {
			return { ...doc.data(), id: doc.id };
		});
		return articles;
	});
};

let article = null;

export const getArticle = () => {
	const params = getParams();
	if (!params.category || !params["sub-category"] || !params.article) return Promise.resolve();
	if (article) return article;

	if (articles) {
		article = articles.find((c) => c.id === params["sub-category"]);
		if (article) return article;
	}
	let articleRef = db
		.collection("articles")
		.doc(params.category)
		.collection("sub-category")
		.doc(params["sub-category"])
		.collection("article")
		.doc(params.article);
	return articleRef.get().then((snap) => {
		if (snap.exists) article = { id: snap.id, ...snap.data() };
		return article || {};
	});
};
export const saveArticle = (data) => {
	const params = getParams();
	let articleRef = db
		.collection("articles")
		.doc(params.category)
		.collection("sub-category")
		.doc(params["sub-category"])
		.collection("article")
		.doc(params.article);
	return articleRef.update(data);
};

var re = /(?:\.([^.]+))?$/;
export const uploadFile = (index, file, id) => {
	return new Promise((resolve, reject) => {
		const ext = re.exec(file.name)?.[1];
		const storageRef = firebase.storage().ref(`support/${id}/${uuidv4()}${ext ? "." + ext : ""}`);
		const task = storageRef.put(file);
		resolve([task, storageRef])
	});
};


export const getNewSupport = ()=>{
	return db.collection("support").doc();
}


export const getTicket = ()=>{
	const params = getParams()
	if (!params.id) return Promise.resolve();

	return db
		.collection("support")
		.doc(params.id)
		.get()
		.then((snap) => {
			if (snap.exists) return { id: snap.id, ...snap.data() };
			return {};
		});
}
