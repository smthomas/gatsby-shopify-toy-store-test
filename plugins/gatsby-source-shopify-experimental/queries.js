'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.incrementalOrdersQuery = exports.incrementalProductsQuery = exports.CREATE_ORDERS_OPERATION = exports.CREATE_PRODUCTS_OPERATION = exports.CANCEL_OPERATION = exports.OPERATION_BY_ID = exports.OPERATION_STATUS_QUERY = void 0
exports.OPERATION_STATUS_QUERY = `
    query {
      currentBulkOperation {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
  `
exports.OPERATION_BY_ID = `
query OPERATION_BY_ID($id: ID!) {
  node(id: $id) {
    ... on BulkOperation {
      id
      status
      errorCode
      createdAt
      completedAt
      objectCount
      fileSize
      url
      partialDataUrl
    }
  }
}
`
exports.CANCEL_OPERATION = `
mutation CANCEL_OPERATION($id: ID!) {
  bulkOperationCancel(id: $id) {
    bulkOperation {
      status
    }
    userErrors {
      field
      message
    }
  }
}
`
function bulkOperationQuery(query) {
  return `
    mutation {
      bulkOperationRunQuery(
      query: """
        ${query}
      """
    ) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
  `
}
const ordersQuery = (dateString) => `
{
  orders${
    dateString
      ? `(query: "created_at:>=${dateString} OR updated_at:>=${dateString}")`
      : ``
  } {
    edges {
      node {
        id
        edited
        closed
        closedAt
        refunds {
          id
          createdAt
        }
        lineItems {
          edges {
            node {
              id
              product {
                id
              }
            }
          }
        }
      }
    }
  }
}
`
const productsQuery = (dateString) => `
{
  products${
    dateString
      ? `(query: "created_at:>=${dateString} OR updated_at:>=${dateString}")`
      : ``
  } {
    edges {
      node {
        id
        storefrontId
        createdAt
        description
        descriptionHtml
        featuredImage {
          id
          altText
          height
          width
          originalSrc
          transformedSrc
        }
        featuredMedia {
          alt
          mediaContentType
          mediaErrors {
            details
          }
          preview {
            image {
              id
              altText
              height
              width
              originalSrc
              transformedSrc
            }
            status
          }
          status
        }
        feedback {
          details {
            app {
              id
            }
            link {
              label
              url
            }
            messages {
              field
              message
            }
          }
          summary
        }
        giftCardTemplateSuffix
        handle
        hasOnlyDefaultVariant
        hasOutOfStockVariants
        isGiftCard
        legacyResourceId
        mediaCount
        onlineStorePreviewUrl
        onlineStoreUrl
        options {
          id
          name
          position
          values
        }
        priceRangeV2 {
          maxVariantPrice {
            amount
            currencyCode
          }
          minVariantPrice {
            amount
            currencyCode
          }
        }
        productType
        publishedAt
        requiresSellingPlan
        sellingPlanGroupCount
        seo {
          description
          title
        }
        status
        tags
        templateSuffix
        title
        totalInventory
        totalVariants
        tracksInventory
        updatedAt
        vendor
        images {
          edges {
            node {
              id
              altText
              src
              originalSrc
              width
              height
            }
          }
        }
        variants {
          edges {
            node {
              id
              storefrontId
              availableForSale
              compareAtPrice
              title
              selectedOptions {
                name
                value
              }
              price
              metafields {
                edges {
                  node {
                    description
                    id
                    key
                    namespace
                    value
                    valueType
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`
exports.CREATE_PRODUCTS_OPERATION = bulkOperationQuery(productsQuery())
exports.CREATE_ORDERS_OPERATION = bulkOperationQuery(ordersQuery())
const incrementalProductsQuery = (date) =>
  bulkOperationQuery(productsQuery(date.toISOString()))
exports.incrementalProductsQuery = incrementalProductsQuery
const incrementalOrdersQuery = (date) =>
  bulkOperationQuery(ordersQuery(date.toISOString()))
exports.incrementalOrdersQuery = incrementalOrdersQuery
//# sourceMappingURL=queries.js.map