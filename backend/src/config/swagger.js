import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vísent CDRView API',
      version: '1.0.0',
      description: `
## B2G Analytics Platform — CDRView Backend

REST API that ingests and exposes the **Vísent CDRView** dataset for B2G (Business-to-Government) analytics.

### Key capabilities
- **\`/datos\`** — query, filter, and paginate CDR records
- **\`/mapa\`** — geospatial aggregations ready to render on a map
- **AI agent integration** — structured responses compatible with the embedded IA assistant

### Authentication
Currently open. JWT-based auth is planned for the next milestone.

### Data source
Vísent CDRView dataset ingested and stored in **Supabase (PostgreSQL)**.
      `.trim(),
      contact: {
        name: 'Equipo 69 — No Country',
        email: 'alejandrolunadev@gmail.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local dev',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Auth', description: 'Session validation (Supabase Auth)' },
      { name: 'Datos', description: 'CDR record queries and filtering' },
      { name: 'Mapa', description: 'Geospatial aggregations' },
    ],
  },
  apis: ['./src/docs/paths/**/*.yaml', './src/docs/components/**/*.yaml'],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}

export { spec };
