import { Response } from "node-fetch";
export declare function makeShopifyFetch(options: ShopifyPluginOptions): (path: string, fetchOptions?: {}, retries?: number) => Promise<Response>;
