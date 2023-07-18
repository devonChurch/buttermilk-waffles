/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

const extractRegionFromHref = (href?: string): string | undefined => {

	if (!href) return undefined;

	const subdomains = new URL(href).hostname.split(".").reverse();

	// ['pizza', 'devon', 'buttermilk-waffles', 'ca', 'app']

	let [_1, _2, _3, region, platform] = subdomains;

	return platform ? region : undefined;
};

const extractPlatformFromHref = (href?: string): string | undefined => {

	if (!href) return undefined;

	const subdomains = new URL(href).hostname.split(".").reverse();

	const [_1, _2, _3, platformWithoutRegion, platformWithRegion] = subdomains;

	return platformWithRegion ?? platformWithoutRegion ?? undefined;
};

const enrichRegionIntoHref = (href: string, region?: string) => {

	const url = new URL(href);
	const platform = extractPlatformFromHref(href);
	const [domain, name, project, ..._1 ] = url.hostname.split(".").reverse();

	url.hostname = [
		platform,
		region,
		project,
		name,
		domain,
	].filter(Boolean).join(".");

	return url.href;
};

const extractReferrerFromRequest = (request: Request) => {
	const referrer = request.headers.get("Referer");

	return referrer ?? undefined; // Remove `null` reference!

}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		// Request.referrer
		// request.headers.get("Referer")

		// if referrer region !== request region
		// - Then enrich request with referrer region

		const referrerHref = extractReferrerFromRequest(request);
		const referrerRegion = extractRegionFromHref(referrerHref);

		const requestHref = request.url;
		const requestRegion = extractRegionFromHref(requestHref);

		if (referrerRegion && referrerRegion !== requestRegion) {
			return new Response("", {
				status: 307,
				headers: new Headers({
					"Location": enrichRegionIntoHref(requestHref, referrerRegion),
					"Content-Type": "text/html"
				})
			});
		}

		const requestPlatform = extractPlatformFromHref(requestHref);


		return new Response((`<!doctype html>
		<html>

			<body>
					<h1>${requestPlatform === "app" ? "User Experience" : "Admin Portal"}</h1>
					<p>Cloudflare Multi-Region XXXxxxxx xxxxxx</p>

					<h2>Logs</h2>
					<ul>
						<li>
							Request:
							<ul>
								<li><strong>Platform:</strong> ${requestPlatform ?? "---"}</li>
								<li><strong>Region:</strong> ${requestRegion ?? "---"}</li>
								<li><strong>HREF:</strong> ${requestHref ?? "---"}</li>
							</ul>
						</li>
						<li>
							Referrer:
							<ul>
								<li><strong>Platform:</strong> ${extractPlatformFromHref(referrerHref) ?? "---"}</li>
								<li><strong>Region:</strong> ${referrerRegion ?? "---"}</li>
								<li><strong>HREF:</strong> ${referrerHref ?? "---"}</li>
							</ul>
						</li>
					</ul>

					<h2>Routes</h2>
					<p></p>
					<ul>
						<li>
							<a href="https://${requestPlatform}.buttermilk-waffles.devon.pizza">Home<a>
						</li>
						<li>
							<a href="https://${requestPlatform}.buttermilk-waffles.devon.pizza/foo">Foo<a>
						</li>
						<li>
							<a href="https://${requestPlatform}.buttermilk-waffles.devon.pizza/bar">Bar<a>
						</li>
					</ul>

					<h2>Region Selector</h2>
					<ul>
						<li>
							<a href="https://${requestPlatform}.buttermilk-waffles.devon.pizza" rel="noreferrer">Regionless</a>
						</li>
						<li>
							<a href="https://${requestPlatform}.ca.buttermilk-waffles.devon.pizza" rel="noreferrer">Canada</a>
						</li>
					</ul>

					<h2>Platform</h2>
					<ul>
						<li>
							<a href="https://app.buttermilk-waffles.devon.pizza">App</a>
						</li>
						<li>
							<a href="https://admin.buttermilk-waffles.devon.pizza">Admin</a>
						</li>
					</ul>
			</body>

		</html>
				`), {
			status: 200,
			statusText: "OK" ,
			headers: new Headers({
				"Content-Type": "text/html"
			})
		});
	},
};
