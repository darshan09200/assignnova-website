const CACHE_NAME = "assignnova";

const fetchUsingCacheFirstStrategy = async (...opts) => {
	const request = new Request(...opts);

	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		console.log(`retrieving response from cache`);
		return cachedResponse;
	}

	console.log(`starting request`);
	const response = await fetch(request);

	if (response.ok) {
		console.log(`saving response to cache`);
		cache.put(request, response);
	}

	return response;
};

self.addEventListener("fetch", (fetchEvent) => {
	if (isRequestingImage(fetchEvent.request)) {
		return fetchUsingCacheFirstStrategy(fetchEvent.request);
	}
});

function isRequestingImage(request) {
	return request?.destination === "image";
}
