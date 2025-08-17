import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { nhost } from './nhost'

// Get the GraphQL URL from Nhost
const graphqlUrl = nhost.graphql.getUrl()

const httpLink = createHttpLink({
  uri: graphqlUrl,
})

const authLink = setContext((_, { headers }) => {
  const token = nhost.auth.getAccessToken()
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(
  createClient({
    url: graphqlUrl.replace('http', 'ws'),
    connectionParams: () => {
      const token = nhost.auth.getAccessToken()
      return {
        headers: {
          authorization: token ? `Bearer ${token}` : '',
        },
      }
    },
  })
) : null

const splitLink = typeof window !== 'undefined' && wsLink ? split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  authLink.concat(httpLink)
) : authLink.concat(httpLink)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Message: {
        keyFields: ["id"],
      },
      Query: {
        fields: {
          messages: {
            keyArgs: ["where", "order_by", "limit", "offset"],
            merge(existing = [], incoming) {
              // Create a map to deduplicate by ID
              const messageMap = new Map();
              
              // Add existing messages
              existing.forEach((msg: any) => {
                if (msg.id) messageMap.set(msg.id, msg);
              });
              
              // Add incoming messages (will overwrite if same ID)
              incoming.forEach((msg: any) => {
                if (msg.id) messageMap.set(msg.id, msg);
              });
              
              // Return sorted array
              return Array.from(messageMap.values()).sort(
                (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
          }
        }
      }
    }
  }),
})