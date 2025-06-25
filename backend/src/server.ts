import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { staticPlugin } from '@elysiajs/static';
import { join } from 'path';
import { mkdir } from 'fs/promises';

import { standardsRouter } from './routes/standards';
import { reportsRouter } from './routes/reports';
import { activitiesRouter } from './routes/activities';
import { ragCompleteRoutes } from './routes/rag-complete';
import { complianceRouter } from './routes/compliance';
import { finetuningRouter } from './routes/finetuning';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
try {
  await mkdir(uploadsDir, { recursive: true });
} catch (error) {
  // Failed to create uploads directory
}

const app = new Elysia()
  .use(cors({
    origin: '*', // In production, you should restrict this to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Accept'],
    exposeHeaders: ['Content-Type', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Carbon Emissions Compliance AI API',
        version: '1.0.0',
        description: 'API for managing ESG standards and compliance reports'
      }
    }
  }))
  // Serve static files from the uploads directory
  .use(staticPlugin({
    assets: uploadsDir,
    prefix: '/uploads',
    alwaysStatic: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, Accept',
      'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Disposition': 'inline'
    }
  }))
  // Add a route to handle external file preview
  .get('/preview', async ({ query, set }) => {
    try {
      const { url } = query;
      
      if (!url) {
        set.status = 400;
        return { error: 'URL parameter is required' };
      }
      
      // Fetch the external file
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        set.status = response.status;
        return { error: `Failed to fetch file: ${response.statusText}` };
      }
      
      // Get content type from response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Set appropriate headers
      set.headers['Content-Type'] = contentType;
      set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      set.headers['Pragma'] = 'no-cache';
      set.headers['Expires'] = '0';
      set.headers['Access-Control-Allow-Origin'] = '*';
      set.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
      set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cache-Control, Pragma, Accept';
      set.headers['Access-Control-Expose-Headers'] = 'Content-Type, Content-Disposition';
      
      // For PDFs, set content disposition to inline for preview
      if (contentType === 'application/pdf') {
        set.headers['Content-Disposition'] = 'inline';
      }
      
      // Return the file content
      return await response.arrayBuffer();
    } catch (error) {
      set.status = 500;
      return { 
        error: 'Failed to preview file', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, {
    query: t.Object({
      url: t.String()
    })
  })
  // Add a direct route to serve PDF files from the uploads directory
  .get('/uploads/:filename', async ({ params, set }) => {
    try {
      const { filename } = params;
      
      // Set appropriate headers for PDF files
      if (filename.toLowerCase().endsWith('.pdf')) {
        set.headers['Content-Type'] = 'application/pdf';
        set.headers['Content-Disposition'] = 'inline';
        set.headers['Access-Control-Allow-Origin'] = '*';
        set.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cache-Control, Pragma, Accept';
        set.headers['Access-Control-Expose-Headers'] = 'Content-Type, Content-Disposition';
        set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        set.headers['Pragma'] = 'no-cache';
        set.headers['Expires'] = '0';
      }
      
      // The file will be served by the static plugin
      return;
    } catch (error) {
      set.status = 500;
      return { 
        error: 'Failed to serve file', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  })
  .group('/api', app => app
    .use(standardsRouter)
    .use(reportsRouter)
    .use(activitiesRouter)
    .use(complianceRouter)
    .use(finetuningRouter)
  )
  .use(ragCompleteRoutes)
  // Add a simple chat endpoint for frontend compatibility at root level
  .post('/chat', async ({ body }) => {
    try {
      const { message } = body as { message: string };
      
      // Forward to the RAG chat endpoint
      const response = await fetch('http://localhost:3001/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Root chat endpoint error:', error);
      return {
        success: false,
        message: "I apologize, but I'm having trouble accessing the ESG knowledge base right now. Please try again in a moment."
      };
    }
  }, {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 1000 })
    })
  })
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return { error: 'Validation Error', details: error.message };
      case 'NOT_FOUND':
        set.status = 404;
        return { error: 'Not Found', details: 'NOT_FOUND' };
      default:
        set.status = 500;
        return { 
          error: 'Internal Server Error', 
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
  });

const port = process.env.PORT || 3001;
app.listen(port); 