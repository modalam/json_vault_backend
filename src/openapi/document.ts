/** Hand-maintained OpenAPI 3.1 document for Phase 4. */
export function buildOpenApiDocument(apiUrl: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'JSON Vault API',
      version: '1.0.0',
      description:
        'Store, edit, and share JSON at the edge. Authenticate with JWT (Bearer) or API keys (`jv_…`).',
    },
    servers: [{ url: apiUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'JWT access token or API key (`jv_live_…` / `jv_dev_…`)',
        },
        editToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Edit-Token',
        },
      },
    },
    paths: {
      '/api/v1/auth/register': {
        post: {
          summary: 'Register',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    displayName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Registered' } },
        },
      },
      '/api/v1/auth/login': {
        post: {
          summary: 'Login',
          tags: ['Auth'],
          responses: { '200': { description: 'Tokens issued' } },
        },
      },
      '/api/v1/auth/me': {
        get: {
          summary: 'Current user',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User profile' } },
        },
      },
      '/api/v1/createblobs': {
        post: {
          summary: 'Create blob',
          tags: ['Blobs'],
          security: [{ bearerAuth: [] }, { editToken: [] }],
          responses: {
            '201': { description: 'Created' },
            '402': { description: 'Quota exceeded' },
          },
        },
      },
      '/api/v1/getblobs': {
        post: {
          summary: 'Get blob content',
          tags: ['Blobs'],
          security: [{ bearerAuth: [] }, { editToken: [] }],
          responses: { '200': { description: 'Blob content' } },
        },
      },
      '/api/v1/updateblobs': {
        post: {
          summary: 'Update blob',
          tags: ['Blobs'],
          security: [{ bearerAuth: [] }, { editToken: [] }],
          responses: { '200': { description: 'Updated' } },
        },
      },
      '/api/v1/deleteblobs': {
        post: {
          summary: 'Delete blob',
          tags: ['Blobs'],
          security: [{ bearerAuth: [] }, { editToken: [] }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/api/v1/blobs': {
        get: {
          summary: 'List blobs',
          tags: ['Blobs'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Blob list' } },
        },
      },
      '/api/v1/vaults': {
        get: {
          summary: 'List vaults',
          tags: ['Vaults'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Vault list' } },
        },
      },
      '/api/v1/api-keys': {
        get: {
          summary: 'List API keys',
          tags: ['API Keys'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'API keys (prefix only)' } },
        },
        post: {
          summary: 'Create API key',
          tags: ['API Keys'],
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Created (includes raw key once)' } },
        },
      },
      '/api/v1/api-keys/{id}': {
        delete: {
          summary: 'Revoke API key',
          tags: ['API Keys'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '204': { description: 'Revoked' } },
        },
      },
      '/api/v1/usage': {
        get: {
          summary: 'Plan usage and quotas',
          tags: ['Usage'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Usage report' } },
        },
      },
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Health'],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  };
}
