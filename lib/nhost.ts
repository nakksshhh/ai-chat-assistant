import { NhostClient } from '@nhost/nhost-js'

// Ensure these environment variables are set in your .env.local file
const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'pfcduhrsqyqfeybxwiiw'
const region = process.env.NEXT_PUBLIC_NHOST_REGION || 'ap-south-1'

const backendUrl = `https://${subdomain}.auth.${region}.nhost.run`

export const nhost = new NhostClient({
  authUrl: `${backendUrl}/v1`,
  storageUrl: `https://${subdomain}.storage.${region}.nhost.run/v1`,
  graphqlUrl: `https://${subdomain}.graphql.${region}.nhost.run/v1`,
  functionsUrl: `https://${subdomain}.functions.${region}.nhost.run/v1`
})