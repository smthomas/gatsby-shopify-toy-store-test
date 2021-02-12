'use strict'
var __asyncValues =
  (this && this.__asyncValues) ||
  function (o) {
    if (!Symbol.asyncIterator)
      throw new TypeError('Symbol.asyncIterator is not defined.')
    var m = o[Symbol.asyncIterator],
      i
    return m
      ? m.call(o)
      : ((o =
          typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
        (i = {}),
        verb('next'),
        verb('throw'),
        verb('return'),
        (i[Symbol.asyncIterator] = function () {
          return this
        }),
        i)
    function verb(n) {
      i[n] =
        o[n] &&
        function (v) {
          return new Promise(function (resolve, reject) {
            ;(v = o[n](v)), settle(resolve, reject, v.done, v.value)
          })
        }
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function (v) {
        resolve({ value: v, done: d })
      }, reject)
    }
  }
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {}
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p]
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]]
      }
    return t
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.sourceNodes = void 0
const node_fetch_1 = __importDefault(require('node-fetch'))
const gatsby_node_helpers_1 = require('gatsby-node-helpers')
const readline_1 = require('readline')
const operations_1 = require('./operations')
const node_builder_1 = require('./node-builder')
const events_1 = require('./events')
const gatsby_plugin_image_1 = require('gatsby-plugin-image')
const graphql_utils_1 = require('gatsby-plugin-image/graphql-utils')
const LAST_SHOPIFY_BULK_OPERATION = `LAST_SHOPIFY_BULK_OPERATION`
module.exports.pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    apiKey: Joi.string().required(),
    password: Joi.string().required(),
    storeUrl: Joi.string().required(),
    downloadImages: Joi.boolean(),
    shopifyConnections: Joi.array()
      .default([])
      .items(Joi.string().valid('orders')),
  })
}
function makeSourceFromOperation(
  finishLastOperation,
  completedOperation,
  gatsbyApi,
  options
) {
  return async function sourceFromOperation(op) {
    var e_1, _a
    const {
      reporter,
      actions,
      createNodeId,
      createContentDigest,
      cache,
    } = gatsbyApi
    try {
      const operationComplete = `Sourced from bulk operation`
      console.time(operationComplete)
      const nodeHelpers = gatsby_node_helpers_1.createNodeHelpers({
        typePrefix: `Shopify`,
        createNodeId,
        createContentDigest,
      })
      const finishLastOp = `Checked for operations in progress`
      console.time(finishLastOp)
      await finishLastOperation()
      console.timeEnd(finishLastOp)
      const initiating = `Initiated bulk operation query`
      console.time(initiating)
      const {
        bulkOperationRunQuery: { userErrors, bulkOperation },
      } = await op()
      console.timeEnd(initiating)
      if (userErrors.length) {
        reporter.panic(
          {
            id: ``,
            context: {
              sourceMessage: `Couldn't perform bulk operation`,
            },
          },
          userErrors
        )
      }
      const waitForCurrentOp = `Completed bulk operation`
      console.time(waitForCurrentOp)
      await cache.set(LAST_SHOPIFY_BULK_OPERATION, bulkOperation.id)
      let resp = await completedOperation(bulkOperation.id)
      console.timeEnd(waitForCurrentOp)
      if (parseInt(resp.node.objectCount, 10) === 0) {
        reporter.info(`No data was returned for this operation`)
        console.timeEnd(operationComplete)
        return
      }
      const results = await node_fetch_1.default(resp.node.url)
      const rl = readline_1.createInterface({
        input: results.body,
        crlfDelay: Infinity,
      })
      const builder = node_builder_1.nodeBuilder(
        nodeHelpers,
        gatsbyApi,
        options
      )
      const creatingNodes = `Created nodes from bulk operation`
      console.time(creatingNodes)
      const promises = []
      try {
        for (
          var rl_1 = __asyncValues(rl), rl_1_1;
          (rl_1_1 = await rl_1.next()), !rl_1_1.done;

        ) {
          const line = rl_1_1.value
          const obj = JSON.parse(line)
          promises.push(builder.buildNode(obj))
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 }
      } finally {
        try {
          if (rl_1_1 && !rl_1_1.done && (_a = rl_1.return)) await _a.call(rl_1)
        } finally {
          if (e_1) throw e_1.error
        }
      }
      await Promise.all(
        promises.map(async (promise) => {
          const node = await promise
          actions.createNode(node)
        })
      )
      console.timeEnd(creatingNodes)
      console.timeEnd(operationComplete)
      await cache.set(LAST_SHOPIFY_BULK_OPERATION, undefined)
    } catch (e) {
      reporter.panic(
        {
          id: ``,
          context: {
            sourceMessage: `Could not source from bulk operation`,
          },
        },
        e
      )
    }
  }
}
async function sourceAllNodes(gatsbyApi, pluginOptions) {
  var _a
  const {
    createProductsOperation,
    createOrdersOperation,
    finishLastOperation,
    completedOperation,
  } = operations_1.createOperations(pluginOptions)
  const operations = [createProductsOperation]
  if (
    (_a = pluginOptions.shopifyConnections) === null || _a === void 0
      ? void 0
      : _a.includes('orders')
  ) {
    operations.push(createOrdersOperation)
  }
  const sourceFromOperation = makeSourceFromOperation(
    finishLastOperation,
    completedOperation,
    gatsbyApi,
    pluginOptions
  )
  await Promise.all(operations.map(sourceFromOperation))
}
const shopifyNodeTypes = [
  `ShopifyLineItem`,
  `ShopifyMetafield`,
  `ShopifyOrder`,
  `ShopifyProduct`,
  `ShopifyProductImage`,
  `ShopifyProductVariant`,
  `ShopifyProductVariantPricePair`,
]
async function sourceChangedNodes(gatsbyApi, pluginOptions) {
  var _a
  const {
    incrementalProducts,
    incrementalOrders,
    finishLastOperation,
    completedOperation,
  } = operations_1.createOperations(pluginOptions)
  const lastBuildTime = await gatsbyApi.cache.get(`LAST_BUILD_TIME`)
  const touchNode = (node) => gatsbyApi.actions.touchNode({ nodeId: node.id })
  for (const nodeType of shopifyNodeTypes) {
    gatsbyApi.getNodesByType(nodeType).forEach(touchNode)
  }
  const operations = [incrementalProducts]
  if (
    (_a = pluginOptions.shopifyConnections) === null || _a === void 0
      ? void 0
      : _a.includes('orders')
  ) {
    operations.push(incrementalOrders)
  }
  const sourceFromOperation = makeSourceFromOperation(
    finishLastOperation,
    completedOperation,
    gatsbyApi,
    pluginOptions
  )
  const deltaSource = (op) => {
    const deltaOp = () => op(new Date(lastBuildTime))
    return sourceFromOperation(deltaOp)
  }
  await Promise.all(operations.map(deltaSource))
  const { fetchDestroyEventsSince } = events_1.eventsApi(pluginOptions)
  const destroyEvents = await fetchDestroyEventsSince(new Date(lastBuildTime))
  if (destroyEvents.length) {
    for (const nodeType of shopifyNodeTypes) {
      gatsbyApi.getNodesByType(nodeType).forEach((node) => {
        /* This is currently untested because all the destroy events for the
         * swag store are for products that this POC has never sourced!
         *
         * Also to consider: what about cascade delete? If a product is removed
         * here, do we clean up variants, metafields, images, etc?
         */
        const event = destroyEvents.find(
          (e) =>
            e.subject_id === parseInt(node.shopifyId, 10) &&
            node.internal.type === `Shopify${e.subject_type}`
        )
        if (event) {
          gatsbyApi.actions.deleteNode({ node })
        }
      })
    }
  }
}
async function sourceNodes(gatsbyApi, pluginOptions) {
  const lastOperationId = await gatsbyApi.cache.get(LAST_SHOPIFY_BULK_OPERATION)
  if (lastOperationId) {
    console.info(`Cancelling last operation`)
    const cancelled = await operations_1
      .createOperations(pluginOptions)
      .cancelOperation(lastOperationId)
    console.info(cancelled)
    await gatsbyApi.cache.set(LAST_SHOPIFY_BULK_OPERATION, undefined)
  }
  const lastBuildTime = await gatsbyApi.cache.get(`LAST_BUILD_TIME`)
  if (lastBuildTime) {
    await sourceChangedNodes(gatsbyApi, pluginOptions)
  } else {
    await sourceAllNodes(gatsbyApi, pluginOptions)
  }
  await gatsbyApi.cache.set(`LAST_BUILD_TIME`, Date.now())
}
exports.sourceNodes = sourceNodes
exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type ShopifyProductVariant implements Node {
      product: ShopifyProduct @link(from: "productId", by: "shopifyId")
      metafields: [ShopifyMetafield]
      presentmentPrices: [ShopifyProductVariantPricePair]
    }

    type ShopifyProduct implements Node {
      variants: [ShopifyProductVariant]
    }

    type ShopifyMetafield implements Node {
      productVariant: ShopifyProductVariant @link(from: "productVariantId", by: "shopifyId")
    }

    type ShopifyProductVariantPricePair implements Node {
      productVariant: ShopifyProductVariant @link(from: "productVariantId", by: "shopifyId")
    }

    type ShopifyOrder implements Node {
      lineItems: [ShopifyLineItem]
    }

    type ShopifyLineItem implements Node {
      product: ShopifyProduct @link(from: "productId", by: "shopifyId")
    }

    type ShopifyProductImage implements Node {
      altText: String
      originalSrc: String!
      product: ShopifyProduct @link(from: "productId", by: "shopifyId")
      localFile: File @link
    }
  `)
}
const validFormats = new Set(['jpg', 'png', 'webp'])
async function resolveGatsbyImageData(image, _a) {
  var { formats = ['auto', 'webp'], layout = 'constrained' } = _a,
    options = __rest(_a, ['formats', 'layout'])
  let [basename, version] = image.originalSrc.split('?')
  const dot = basename.lastIndexOf('.')
  let ext = ''
  if (dot !== -1) {
    ext = basename.slice(dot + 1)
    basename = basename.slice(0, dot)
  }
  const generateImageSource = (filename, width, height, toFormat) => {
    if (!validFormats.has(toFormat)) {
      console.warn(
        `${toFormat} is not a valid format. Valid formats are: ${[
          ...validFormats,
        ].join(', ')}`
      )
      toFormat = 'jpg'
    }
    let suffix = ''
    if (toFormat === ext) {
      suffix = `.${toFormat}`
    } else {
      suffix = `.${ext}.${toFormat}`
    }
    return {
      width,
      height,
      format: toFormat,
      src: `${filename}_${width}x${height}_crop_center${suffix}?${version}`,
    }
  }
  const sourceMetadata = {
    width: image.width,
    height: image.height,
    format: ext,
  }
  return gatsby_plugin_image_1.generateImageData(
    Object.assign(Object.assign({}, options), {
      formats,
      layout,
      sourceMetadata,
      pluginName: `gatsby-source-shopify-experimental`,
      filename: basename,
      generateImageSource,
    })
  )
}
/**
 * FIXME
 *
 * What are the types for the resolve functions?
 */
exports.createResolvers = ({ createResolvers }, { downloadImages }) => {
  const resolvers = {
    ShopifyOrder: {
      lineItems: {
        type: ['ShopifyLineItem'],
        resolve(source, _args, context, _info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                orderId: { eq: source.shopifyId },
              },
            },
            type: 'ShopifyLineItem',
            firstOnly: false,
          })
        },
      },
    },
    ShopifyProductVariant: {
      presentmentPrices: {
        type: ['ShopifyProductVariantPricePair'],
        resolve(source, _args, context, _info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                productVariantId: { eq: source.shopifyId },
              },
            },
            type: 'ShopifyProductVariantPricePair',
            firstOnly: false,
          })
        },
      },
      metafields: {
        type: ['ShopifyMetafield'],
        resolve(source, _args, context, _info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                productVariantId: { eq: source.shopifyId },
              },
            },
            type: 'ShopifyMetafield',
            firstOnly: false,
          })
        },
      },
    },
    ShopifyProduct: {
      images: {
        type: ['ShopifyProductImage'],
        resolve(source, _args, context, _info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                productId: { eq: source.shopifyId },
              },
            },
            type: 'ShopifyProductImage',
            firstOnly: false,
          })
        },
      },
      variants: {
        type: ['ShopifyProductVariant'],
        resolve(source, _args, context, _info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                productId: { eq: source.shopifyId },
              },
            },
            type: 'ShopifyProductVariant',
            firstOnly: false,
          })
        },
      },
    },
  }
  if (!downloadImages) {
    resolvers.ShopifyProductImage = {
      gatsbyImageData: graphql_utils_1.getGatsbyImageResolver(
        resolveGatsbyImageData
      ),
    }
  }
  createResolvers(resolvers)
}
//# sourceMappingURL=gatsby-node.js.map
