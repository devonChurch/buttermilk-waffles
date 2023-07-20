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
		<html lang="en">

			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
			</head>

			<body class="bg-light">

				<main class="container-md py-4">

					<h1 class="mb-4">${requestPlatform === "app" ? "💡 User Experience" : "⚙️ Admin Portal"}</h1>

					<ul class="list-group bg-white rounded-3 shadow">


						<li class="list-group-item p-4">

							<h2 class="h3 mb-3">🌏 Regions</h2>
							<div class="d-flex flex-row gap-3">
								<a class="btn btn-outline-primary" href="https://${requestPlatform}.buttermilk-waffles.devon.pizza" rel="noreferrer">Regionless</a>
								<a class="btn btn-outline-primary" href="https://${requestPlatform}.ca.buttermilk-waffles.devon.pizza" rel="noreferrer">Canada</a>
							</div>
						</li>


						<li class="list-group-item p-4">

							<h2 class="h3 mb-3">🚧 Platform</h2>
							<div class="d-flex flex-row gap-3">
								<a class="btn btn-outline-primary" href="https://app.buttermilk-waffles.devon.pizza">User Experience</a>
								<a class="btn btn-outline-primary" href="https://admin.buttermilk-waffles.devon.pizza">Admin Portal</a>
							</div>
						</li>

						<li class="list-group-item p-4">

							<h2 class="h3 mb-3">🎨 Content</h2>
							<div id="content" class="d-flex flex-column gap-4">

							</div>
						</li>

						<li class="list-group-item p-4">
							<h2 class="h3 mb-3">🔗 Routes</h2>

							<div class="d-flex flex-column gap-4">
								<div class="p-3 border rounded bg-light">
									<h3 class="h6">Server:</h3>
									<div class="d-flex flex-row gap-3">
										<a class="btn btn-outline-primary" href="https://${requestPlatform}.buttermilk-waffles.devon.pizza">Home</a>
										<a class="btn btn-outline-primary" href="https://${requestPlatform}.buttermilk-waffles.devon.pizza/assessments">Assessments</a>
										<a class="btn btn-outline-primary" href="https://${requestPlatform}.buttermilk-waffles.devon.pizza/content">Content</a>
									</div>
								</div>

								<div class="p-3 border rounded bg-light">
									<h3 class="h6">Client:</h3>
									<div class="d-flex flex-row gap-3">
										<a class="btn btn-outline-primary" href="/enrolments">Enrolments</a>
										<a class="btn btn-outline-primary" href="/insight">Insights</a>
										<a class="btn btn-outline-primary" href="/pathways">Pathways</a>
									</div>
								</div>
							</div>
						</li>


						<li class="list-group-item p-4">

							<h2 class="h3 mb-3">📝 Logs</h2>

							<div id="logs" class="d-flex flex-column gap-4">
								<div class="p-3 border rounded bg-light">
									<h3 class="h6">Request:</h3>
									<ul>
										<li><strong>Platform:</strong> ${requestPlatform ?? "---"}</li>
										<li><strong>Region:</strong> ${requestRegion ?? "---"}</li>
										<li><strong>HREF:</strong> ${requestHref ?? "---"}</li>
									</ul>
								</div>

								<div class="p-3 border rounded bg-light">
									<h3 class="h6">Referrer:</h3>
									<ul>
										<li><strong>Platform:</strong> ${extractPlatformFromHref(referrerHref) ?? "---"}</li>
										<li><strong>Region:</strong> ${referrerRegion ?? "---"}</li>
										<li><strong>HREF:</strong> ${referrerHref ?? "---"}</li>
									</ul>
								</div>
							</div>

						</li>
					</ul>

				</main>

				<script>
					const enrichContent = () => {
						const text = document.querySelector(\`a[href$="\$\{window.location.pathname\}"]\`)?.innerHTML ?? "Home";

						document.getElementById("content").innerHTML = (\`
							<div class="p-3 border rounded bg-light">
								<h3 class="h6"><strong>\$\{text\}:</strong></h3>
								<p class="mb-0">You are on the \$\{text\} page inside the ${requestPlatform} platform.</p>
							</div>
						\`)
					}

					[...document.querySelectorAll('a[href^="/"]')]
						.forEach(element => element.addEventListener("click", (event) => {
							event.preventDefault();
							window.history.pushState("", {}, event.target.href);

							document.getElementById("logs").innerHTML = (\`
								<div class="p-3 border rounded bg-light">
									<h3 class="h6">Client:</h3>
									<ul>
										<li><strong>Pathname:</strong> \$\{event.target.pathname\}</li>
									</ul>
								</div>
							\`);

							enrichContent();
						}));

						enrichContent();

				</script>

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
