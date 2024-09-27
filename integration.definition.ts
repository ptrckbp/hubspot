import { IntegrationDefinition, messages } from '@botpress/sdk'
import { name, integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName ?? name,
  version: '0.2.0',
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
  secrets: {
    DEV_LOGS_URL: {
      optional: true,
      description: "The URL to send logs to",
    },
  },
});
