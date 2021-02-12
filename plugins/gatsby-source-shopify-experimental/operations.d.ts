export interface BulkOperationRunQueryResponse {
    bulkOperationRunQuery: {
        userErrors: Error[];
        bulkOperation: {
            id: string;
        };
    };
}
export declare function createOperations(options: ShopifyPluginOptions): {
    incrementalProducts(date: Date): Promise<BulkOperationRunQueryResponse>;
    incrementalOrders(date: Date): Promise<BulkOperationRunQueryResponse>;
    createProductsOperation(): Promise<BulkOperationRunQueryResponse>;
    createOrdersOperation(): Promise<BulkOperationRunQueryResponse>;
    cancelOperation(id: string): Promise<any>;
    finishLastOperation: () => Promise<void>;
    completedOperation: (operationId: string, interval?: number) => Promise<{
        node: {
            objectCount: string;
            url: string;
        };
    }>;
};
