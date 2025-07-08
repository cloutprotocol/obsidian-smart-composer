export interface Env {
	ASSETS: Fetcher;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// This serves your static assets.
		// It automatically handles serving files from the "./dist" directory.
		return env.ASSETS.fetch(request);
	},
}; 