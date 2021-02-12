import { NodeInput, SourceNodesArgs } from "gatsby";
import { NodeHelpers } from "gatsby-node-helpers";
export declare function nodeBuilder(nodeHelpers: NodeHelpers, gatsbyApi: SourceNodesArgs, options: ShopifyPluginOptions): {
    buildNode(obj: Record<string, any>): Promise<NodeInput>;
};
