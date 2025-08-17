import { gql } from '@apollo/client'

export const MESSAGES_SUBSCRIPTION = gql`
  subscription MessagesSubscription($chatId: uuid!) {
    messages(
      where: { chat_id: { _eq: $chatId } }
      order_by: { created_at: asc }
    ) {
      id
      content
      sender
      created_at
    }
  }
`