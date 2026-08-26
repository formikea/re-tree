import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { swaggerUI } from '@hono/swagger-ui'
import auth from './routes/auth.js'
import admin from './routes/admin.js'
import organization from './routes/organization.js'
import users from './routes/users.js'
import species from './routes/species.js'
import sites from './routes/sites.js'
import batches from './routes/batches.js'
import seasons from './routes/seasons.js'
import allotments from './routes/allotments.js'
import nurseries from './routes/nurseries.js'
import { stripe } from './routes/stripe.js'
import { authRateLimit } from './middleware/rate-limit.js'


const app = new Hono()

const allowedOrigins = new Set([
  'https://app.re-tree.app',
  'https://re-tree.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
])

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Non-browser clients (curl, Workers, same-origin) may omit Origin
      if (!origin) return origin
      return allowedOrigins.has(origin) ? origin : null
    },
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

// Middleware to check if documentation should be available
const docsMiddleware = async (c: any, next: any) => {
  const host = c.req.header('host') || ''
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1')
  const isDevelopment = nodeEnv === 'development'
  
  if (!isLocalhost || !isDevelopment) {
    return c.json({
      error: 'Not Found',
      message: 'API documentation is only available on localhost in development mode',
      timestamp: new Date().toISOString()
    }, 404)
  }
  
  await next()
}

// Swagger UI with a simple OpenAPI spec - only available on localhost
app.get('/docs', docsMiddleware, swaggerUI({ 
  url: '/openapi.json',
  title: 'Re-Tree API Documentation'
}))

// Simple OpenAPI specification - only available on localhost
app.get('/openapi.json', docsMiddleware, (c) => {
  
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Re-Tree API',
      version: '2.0.0',
      description: 'A multi-tenant RESTful API for managing reforestation projects, species, sites, batches, seasons, allotments, and nurseries. Features include bulk operations, organization-scoped data access, and comprehensive validation.',
      contact: {
        name: 'API Support',
        email: 'support@re-tree.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Organization',
        description: 'Organization invitation and user management endpoints'
      },
      {
        name: 'Users',
        description: 'Organization user management endpoints'
      },
      {
        name: 'Species',
        description: 'Tree species management (global data)'
      },
      {
        name: 'Sites',
        description: 'Planting site management (organization-scoped)'
      },
      {
        name: 'Nurseries',
        description: 'Nursery management (organization-scoped)'
      },
      {
        name: 'Batches',
        description: 'Seedling batch management (organization-scoped)'
      },
      {
        name: 'Seasons',
        description: 'Planting season management (organization-scoped)'
      },
      {
        name: 'Allotments',
        description: 'Allotment management with bulk operations (organization-scoped)'
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints for organization and user management'
      }
    ],
    paths: {
      '/': {
        get: {
          summary: 'API Information',
          description: 'Get API information and health status',
          responses: {
            '200': {
              description: 'API information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      version: { type: 'string' },
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/health': {
        get: {
          summary: 'Health Check',
          description: 'Simple health check endpoint',
          responses: {
            '200': {
              description: 'Health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'User login',
          description: 'Authenticate a user and return a JWT token with organization information',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Authentication failed',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/refresh': {
        post: {
          summary: 'Refresh JWT token',
          description: 'Refresh an access token using a refresh token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RefreshTokenRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RefreshTokenResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          summary: 'User logout',
          description: 'Logout a user by invalidating their refresh token',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/verify': {
        get: {
          summary: 'Verify JWT token',
          description: 'Verify the validity of a JWT token and return user information',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Token is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/reset-password': {
        post: {
          summary: 'Reset password',
          description: 'Reset user password using current password',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResetPasswordRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password reset successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/species': {
        get: {
          summary: 'Get all species',
          description: 'Retrieve a list of all tree species (global data)',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of species',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      species: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Species'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new species',
          description: 'Create a new tree species',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateSpecies'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Species created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      species: {
                        $ref: '#/components/schemas/Species'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/species/organisation/{organisationId}': {
        get: {
          summary: 'Get species by organization ID',
          description: 'Retrieve all species for a specific organization',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'organisationId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of species for the organization',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      species: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Species'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Add species to organization',
          description: 'Add a species to an organization\'s species list',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'organisationId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['speciesId'],
                  properties: {
                    speciesId: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Species added to organization successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/species/organisation/{organisationId}/{speciesId}': {
        delete: {
          summary: 'Remove species from organization',
          description: 'Remove a species from an organization\'s species list',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'organisationId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            },
            {
              name: 'speciesId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Species ID'
            }
          ],
          responses: {
            '200': {
              description: 'Species removed from organization successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/species/{id}': {
        get: {
          summary: 'Get species by ID',
          description: 'Retrieve a specific species by its ID',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Species ID'
            }
          ],
          responses: {
            '200': {
              description: 'Species details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      species: {
                        $ref: '#/components/schemas/Species'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a species',
          description: 'Update an existing species by ID',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Species ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateSpecies'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Species updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      species: {
                        $ref: '#/components/schemas/Species'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete a species',
          description: 'Delete a species by ID',
          tags: ['Species'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Species ID'
            }
          ],
          responses: {
            '200': {
              description: 'Species deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/sites': {
        get: {
          summary: 'Get all sites',
          description: 'Retrieve a list of all sites for the authenticated user\'s organization',
          tags: ['Sites'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of sites',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sites: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Site'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new site',
          description: 'Create a new site for the authenticated user\'s organization',
          tags: ['Sites'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateSite'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Site created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      site: {
                        $ref: '#/components/schemas/Site'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/sites/{id}': {
        get: {
          summary: 'Get site by ID',
          description: 'Retrieve a specific site by its ID (organization-scoped)',
          tags: ['Sites'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Site ID'
            }
          ],
          responses: {
            '200': {
              description: 'Site details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      site: {
                        $ref: '#/components/schemas/Site'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a site',
          description: 'Update an existing site by ID (organization-scoped)',
          tags: ['Sites'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Site ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateSite'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Site updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      site: {
                        $ref: '#/components/schemas/Site'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete a site',
          description: 'Delete a site by ID (organization-scoped)',
          tags: ['Sites'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Site ID'
            }
          ],
          responses: {
            '200': {
              description: 'Site deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/batches': {
        get: {
          summary: 'Get all batches',
          description: 'Retrieve a list of all batches for the authenticated user\'s organization',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of batches',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      batches: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Batch'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new batch',
          description: 'Create a new batch for the authenticated user\'s organization',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateBatch'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Batch created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      batch: {
                        $ref: '#/components/schemas/Batch'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/batches/{id}': {
        get: {
          summary: 'Get batch by ID',
          description: 'Retrieve a specific batch by its ID (organization-scoped)',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Batch ID'
            }
          ],
          responses: {
            '200': {
              description: 'Batch details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      batch: {
                        $ref: '#/components/schemas/Batch'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a batch',
          description: 'Update an existing batch by ID (organization-scoped)',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Batch ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateBatch'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Batch updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      batch: {
                        $ref: '#/components/schemas/Batch'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete a batch',
          description: 'Delete a batch by ID (organization-scoped)',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Batch ID'
            }
          ],
          responses: {
            '200': {
              description: 'Batch deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/batches/nursery/{nurseryId}': {
        get: {
          summary: 'Get batches by nursery ID',
          description: 'Retrieve all batches for a specific nursery (organization-scoped)',
          tags: ['Batches'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'nurseryId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Nursery ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of batches for the nursery',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      batches: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Batch'
                        }
                      },
                      count: { type: 'number' },
                      nursery: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string' }
                        }
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Nursery not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/seasons': {
        get: {
          summary: 'Get all seasons',
          description: 'Retrieve a list of all seasons for the authenticated user\'s organization',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of plantings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      seasons: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Season'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new season',
          description: 'Create a new season for the authenticated user\'s organization',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateSeason'
                }
              }
            }
          },
          responses: {
                          '201': {
                description: 'Season created successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        season: {
                          $ref: '#/components/schemas/Season'
                        },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/seasons/site/{siteId}': {
        get: {
          summary: 'Get seasons by site ID',
          description: 'Retrieve all seasons for a specific site (organization-scoped)',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'siteId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Site ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of seasons for the site',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      seasons: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Season'
                        }
                      },
                      count: { type: 'number' },
                      site: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string' }
                        }
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Site not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/seasons/bulk': {
        post: {
          summary: 'Create seasons for all organization sites',
          description: 'Create seasons for all sites in the organization for a specific year and season',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BulkCreateSeason'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Seasons created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      seasons: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Season'
                        }
                      },
                      created: { type: 'number' },
                      skipped: { type: 'number' },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Site not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/seasons/{id}': {
        get: {
          summary: 'Get season by ID',
          description: 'Retrieve a specific season by its ID (organization-scoped)',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Season ID'
            }
          ],
          responses: {
            '200': {
              description: 'Season details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      season: {
                        $ref: '#/components/schemas/Season'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a season',
          description: 'Update an existing season by ID (organization-scoped)',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Season ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateSeason'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Season updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      season: {
                        $ref: '#/components/schemas/Season'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete a season',
          description: 'Delete a season by ID (organization-scoped)',
          tags: ['Seasons'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Season ID'
            }
          ],
          responses: {
            '200': {
              description: 'Season deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/allotments': {
        get: {
          summary: 'Get all allotments',
          description: 'Retrieve a list of all allotments for the authenticated user\'s organization',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of allotments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotments: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Allotment'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new allotment',
          description: 'Create a new allotment for the authenticated user\'s organization',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateAllotment'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Allotment created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotment: {
                        $ref: '#/components/schemas/Allotment'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Season or batch not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/allotments/bulk': {
        post: {
          summary: 'Create multiple allotments',
          description: 'Create multiple allotments in a single request. Maximum 100 allotments per request.',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BulkCreateAllotment'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Allotments created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotments: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Allotment'
                        }
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Season or batch not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/allotments/season/{seasonId}': {
        get: {
          summary: 'Get allotments by season ID',
          description: 'Retrieve all allotments for a specific season (organization-scoped)',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'seasonId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Season ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of allotments for the season',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotments: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Allotment'
                        }
                      },
                      count: { type: 'number' },
                      season: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          year: { type: 'number' },
                          season: { type: 'string' },
                          site: {
                            $ref: '#/components/schemas/Site'
                          }
                        }
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Season not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/allotments/{id}': {
        get: {
          summary: 'Get allotment by ID',
          description: 'Retrieve a specific allotment by its ID (organization-scoped)',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Allotment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Allotment details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotment: {
                        $ref: '#/components/schemas/Allotment'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Allotment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update an allotment',
          description: 'Update an existing allotment by ID (organization-scoped)',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Allotment ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateAllotment'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Allotment updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allotment: {
                        $ref: '#/components/schemas/Allotment'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Allotment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete an allotment',
          description: 'Delete an allotment by ID (organization-scoped)',
          tags: ['Allotments'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Allotment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Allotment deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Allotment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/nurseries': {
        get: {
          summary: 'Get all nurseries',
          description: 'Retrieve a list of all nurseries for the authenticated user\'s organization',
          tags: ['Nurseries'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of nurseries',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      nurseries: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Nursery'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new nursery',
          description: 'Create a new nursery for the authenticated user\'s organization',
          tags: ['Nurseries'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateNursery'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Nursery created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      nursery: {
                        $ref: '#/components/schemas/Nursery'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/nurseries/{id}': {
        get: {
          summary: 'Get nursery by ID',
          description: 'Retrieve a specific nursery by its ID (organization-scoped)',
          tags: ['Nurseries'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Nursery ID'
            }
          ],
          responses: {
            '200': {
              description: 'Nursery details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      nursery: {
                        $ref: '#/components/schemas/Nursery'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a nursery',
          description: 'Update an existing nursery by ID (organization-scoped)',
          tags: ['Nurseries'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Nursery ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateNursery'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Nursery updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      nursery: {
                        $ref: '#/components/schemas/Nursery'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete a nursery',
          description: 'Delete a nursery by ID (organization-scoped)',
          tags: ['Nurseries'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Nursery ID'
            }
          ],
          responses: {
            '200': {
              description: 'Nursery deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/organizations': {
        get: {
          summary: 'Get all organizations (Admin only)',
          description: 'Retrieve a list of all organizations with user counts and related data',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of organizations',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      organizations: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/OrganizationWithCounts'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '403': {
              description: 'Admin privileges required',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create organization (Admin only)',
          description: 'Create a new organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateOrganization'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Organization created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      organization: {
                        $ref: '#/components/schemas/OrganizationWithCounts'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users': {
        get: {
          summary: 'Get organization users',
          description: 'Retrieve all users for the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of organization users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/OrganizationUser'
                        }
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create organization user',
          description: 'Create a new user in the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateOrganizationUser'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/OrganizationUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users/{userId}': {
        get: {
          summary: 'Get user by ID',
          description: 'Retrieve a specific user by ID within the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/OrganizationUser'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update user',
          description: 'Update an existing user by ID within the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateOrganizationUser'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/OrganizationUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete user',
          description: 'Delete a user by ID within the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users/{userId}/role': {
        patch: {
          summary: 'Update user role',
          description: 'Update a user\'s role within the current user\'s organization',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['USER', 'MANAGER', 'SUPER_ADMIN'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User role updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/OrganizationUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users/{userId}/resend-invitation': {
        post: {
          summary: 'Resend invitation',
          description: 'Resend invitation email to a user',
          tags: ['Users'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'Invitation resent successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/organizations/{id}': {
        get: {
          summary: 'Get organization by ID (Admin only)',
          description: 'Retrieve a specific organization by ID',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          responses: {
            '200': {
              description: 'Organization details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      organization: {
                        $ref: '#/components/schemas/OrganizationWithCounts'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update organization (Admin only)',
          description: 'Update an existing organization by ID',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateOrganization'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Organization updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      organization: {
                        $ref: '#/components/schemas/OrganizationWithCounts'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete organization (Admin only)',
          description: 'Delete an organization by ID',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          responses: {
            '200': {
              description: 'Organization deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/organizations/{id}/users': {
        get: {
          summary: 'Get organization users (Admin only)',
          description: 'Retrieve all users for a specific organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of organization users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/AdminUser'
                        }
                      },
                      organization: {
                        $ref: '#/components/schemas/Organisation'
                      },
                      count: { type: 'number' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create organization user (Admin only)',
          description: 'Create a new user in the specified organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateOrganizationUser'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/AdminUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/organizations/{orgId}/users/{userId}': {
        get: {
          summary: 'Get organization user by ID (Admin only)',
          description: 'Retrieve a specific user by ID within an organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'orgId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            },
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/AdminUser'
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update organization user (Admin only)',
          description: 'Update an existing user by ID within an organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'orgId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            },
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateOrganizationUser'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/AdminUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete organization user (Admin only)',
          description: 'Delete a user by ID within an organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'orgId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            },
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/organizations/{orgId}/users/{userId}/role': {
        patch: {
          summary: 'Update organization user role (Admin only)',
          description: 'Update a user\'s role within an organization',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'orgId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Organization ID'
            },
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['USER', 'MANAGER', 'SUPER_ADMIN'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User role updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/AdminUser'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/roles': {
        get: {
          summary: 'Get available roles (Admin only)',
          description: 'Retrieve a list of available user roles',
          tags: ['Admin'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'List of available roles',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      roles: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            value: { type: 'string' },
                            label: { type: 'string' },
                            description: { type: 'string' }
                          }
                        }
                      },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/organization/invite/verify/{token}': {
        get: {
          summary: 'Verify invitation token',
          description: 'Verify the validity of an invitation token',
          tags: ['Organization'],
          parameters: [
            {
              name: 'token',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Invitation token'
            }
          ],
          responses: {
            '200': {
              description: 'Invitation token is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string', nullable: true },
                          email: { type: 'string' },
                          role: { type: 'string' },
                          organisation: {
                            $ref: '#/components/schemas/Organisation'
                          }
                        }
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Invalid or expired invitation token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '410': {
              description: 'Invitation token has expired',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/organization/invite/accept': {
        post: {
          summary: 'Accept invitation',
          description: 'Accept an invitation and set password',
          tags: ['Organization'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AcceptInvitationRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Invitation accepted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Invalid or expired invitation token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '410': {
              description: 'Invitation token has expired',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },

    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Authentication schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              $ref: '#/components/schemas/User'
            },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            organisationId: { type: 'number' },
            organisation: {
              $ref: '#/components/schemas/Organisation'
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Organisation: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        // Species schemas
        Species: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            botanicalName: { type: 'string', nullable: true },
            commonName: { type: 'string', nullable: true },
            maoriName: { type: 'string', nullable: true },
            threatenedSpecies: { type: 'boolean' },
            treesThatCount: { type: 'boolean' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateSpecies: {
          type: 'object',
          properties: {
            botanicalName: { type: 'string', nullable: true },
            commonName: { type: 'string', nullable: true },
            maoriName: { type: 'string', nullable: true },
            threatenedSpecies: { type: 'boolean', default: false },
            treesThatCount: { type: 'boolean', default: false },
            notes: { type: 'string', nullable: true }
          }
        },
        UpdateSpecies: {
          type: 'object',
          properties: {
            botanicalName: { type: 'string', nullable: true },
            commonName: { type: 'string', nullable: true },
            maoriName: { type: 'string', nullable: true },
            threatenedSpecies: { type: 'boolean' },
            treesThatCount: { type: 'boolean' },
            notes: { type: 'string', nullable: true }
          }
        },
        // Site schemas
        Site: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            region: { type: 'string', nullable: true },
            coordinates: { type: 'string', nullable: true },
            area: { type: 'number', nullable: true },
            owner: { type: 'string', nullable: true },
            type: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            organisationId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateSite: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            region: { type: 'string', nullable: true },
            coordinates: { type: 'string', nullable: true },
            area: { type: 'number', nullable: true },
            owner: { type: 'string', nullable: true },
            type: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true }
          }
        },
        UpdateSite: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            region: { type: 'string', nullable: true },
            coordinates: { type: 'string', nullable: true },
            area: { type: 'number', nullable: true },
            owner: { type: 'string', nullable: true },
            type: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true }
          }
        },
        // Nursery schemas
        Nursery: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            organisationId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateNursery: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' }
          }
        },
        UpdateNursery: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        // Batch schemas
        Batch: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            speciesId: { type: 'number' },
            nurseryId: { type: 'number' },
            origin: { type: 'string', nullable: true },
            quantity: { type: 'number', nullable: true },
            stage: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            species: {
              $ref: '#/components/schemas/Species'
            },
            nursery: {
              $ref: '#/components/schemas/Nursery'
            }
          }
        },
        CreateBatch: {
          type: 'object',
          required: ['speciesId', 'nurseryId'],
          properties: {
            speciesId: { type: 'number' },
            nurseryId: { type: 'number' },
            origin: { type: 'string', nullable: true },
            quantity: { type: 'number', nullable: true },
            stage: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true }
          }
        },
        UpdateBatch: {
          type: 'object',
          properties: {
            speciesId: { type: 'number' },
            nurseryId: { type: 'number' },
            origin: { type: 'string', nullable: true },
            quantity: { type: 'number', nullable: true },
            stage: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true }
          }
        },
        // Season schemas
        Season: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            siteId: { type: 'number' },
            organisationId: { type: 'number' },
            year: { type: 'number' },
            season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            site: {
              $ref: '#/components/schemas/Site'
            }
          }
        },
        CreateSeason: {
          type: 'object',
          required: ['siteId', 'year', 'season'],
          properties: {
            siteId: { type: 'number' },
            year: { type: 'number', minimum: 1900, maximum: 2100 },
            season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
            notes: { type: 'string', nullable: true }
          }
        },
        UpdateSeason: {
          type: 'object',
          properties: {
            siteId: { type: 'number' },
            year: { type: 'number', minimum: 1900, maximum: 2100 },
            season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
            notes: { type: 'string', nullable: true }
          }
        },
        // Allotment schemas
        Allotment: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            seasonId: { type: 'number' },
            batchId: { type: 'number' },
            quantity: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            season: {
              $ref: '#/components/schemas/Season'
            },
            batch: {
              $ref: '#/components/schemas/Batch'
            }
          }
        },
        CreateAllotment: {
          type: 'object',
          required: ['seasonId', 'batchId', 'quantity'],
          properties: {
            seasonId: { type: 'number' },
            batchId: { type: 'number' },
            quantity: { type: 'number', minimum: 1 }
          }
        },
        UpdateAllotment: {
          type: 'object',
          properties: {
            seasonId: { type: 'number' },
            batchId: { type: 'number' },
            quantity: { type: 'number', minimum: 1 }
          }
        },
        BulkCreateAllotment: {
          type: 'object',
          required: ['allotments'],
          properties: {
            allotments: {
              type: 'array',
              minItems: 1,
              maxItems: 100,
              items: {
                $ref: '#/components/schemas/CreateAllotment'
              },
              description: 'Array of allotments to create. Maximum 100 allotments per request.'
            }
          }
        },
        // Admin schemas
        OrganizationWithCounts: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            _count: {
              type: 'object',
              properties: {
                users: { type: 'number' },
                sites: { type: 'number' },
                nurseries: { type: 'number' },
                seasons: { type: 'number' }
              }
            }
          }
        },
        CreateOrganization: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 }
          }
        },
        UpdateOrganization: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 }
          }
        },
        AdminUser: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'MANAGER', 'SUPER_ADMIN'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            organisation: {
              $ref: '#/components/schemas/Organisation'
            }
          }
        },
        CreateOrganizationUser: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            name: { type: 'string', maxLength: 255, nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            notes: { type: 'string', maxLength: 1000, nullable: true }
          },
          description: 'New users are created as non-admin by default. Use the update endpoint to grant admin privileges.'
        },
        UpdateOrganizationUser: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 255, nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['USER', 'MANAGER', 'SUPER_ADMIN'] },
            notes: { type: 'string', maxLength: 1000, nullable: true }
          }
        },
        // Additional authentication schemas
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' }
          }
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', minLength: 1 },
            newPassword: { type: 'string', minLength: 6 }
          }
        },
        // Organization invitation schemas
        AcceptInvitationRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string', maxLength: 255, nullable: true }
          }
        },
        // Organization user schemas
        OrganizationUser: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'MANAGER', 'SUPER_ADMIN'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // Bulk operation schemas
        BulkCreateSeason: {
          type: 'object',
          required: ['siteId', 'year', 'season'],
          properties: {
            siteId: { type: 'number' },
            year: { type: 'number', minimum: 1900, maximum: 2100 },
            season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
            notes: { type: 'string', nullable: true }
          }
        }

      }
    }
  })
})

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Re-Tree API',
    version: '2.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Health check for Cloudflare / local Compose
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// API routes
app.get('/api/hello', (c) => {
  return c.json({
    message: 'Hello from Re-Tree API!',
    timestamp: new Date().toISOString()
  })
})

// Auth routes — rate-limit unauthenticated abuse surfaces
app.use('/api/auth/login', authRateLimit)
app.use('/api/auth/refresh', authRateLimit)
app.use('/api/auth/reset-password', authRateLimit)
app.use('/api/organization/invite/*', authRateLimit)
app.route('/api/auth', auth)

// Admin routes (protected by admin middleware)
app.route('/api/admin', admin)

// User management routes
app.route('/api/users', users)

// Organization routes (for organization-specific user management)
app.route('/api/organization', organization)

// Multi-tenant routes
app.route('/api/species', species)
app.route('/api/sites', sites)
app.route('/api/batches', batches)
app.route('/api/seasons', seasons)
app.route('/api/allotments', allotments)
app.route('/api/nurseries', nurseries)

// Stripe routes
app.route('/api', stripe)


// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  }, 500)
})

export default app 