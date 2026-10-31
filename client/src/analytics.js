import { OpenPanel } from '@openpanel/web'

const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID

// Anonymous analytics; inert unless a client ID is configured. No identify() or PII.
export const op = clientId
  ? new OpenPanel({
      clientId,
      trackScreenViews: true,
      trackOutgoingLinks: true,
      trackAttributes: true,
    })
  : null
