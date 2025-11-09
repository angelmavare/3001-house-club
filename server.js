const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Notion client with API version 2025-09-03
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03',
});

// Club database IDs
const CLUB_DATABASES = {
  members: '16d03b7b-0a84-8037-8bf9-fbed98efe753',
  achievements: '24403b7b-0a84-80ee-9e6d-fe5d8ec10aee'
};

// Private page ID (format: with or without dashes)
// Original ID: 12a03b7b0a84801e839cdace8e210497
const PRIVATE_PAGE_ID = '12a03b7b-0a84-801e-839c-dace8e210497';

// Cache for data source IDs (database_id -> data_source_id)
const dataSourceCache = new Map();

/**
 * Get data source ID from a database ID
 * This implements Step 1 of the migration guide: discovery step to fetch data_source_id
 * @param {string} databaseId - The database ID
 * @returns {Promise<string>} - The data source ID (first data source for the database)
 */
async function getDataSourceId(databaseId) {
  // Check cache first
  if (dataSourceCache.has(databaseId)) {
    return dataSourceCache.get(databaseId);
  }

  try {
    // Use the new Get Database API to retrieve data sources
    const database = await notion.databases.retrieve({ 
      database_id: databaseId 
    });
    
    // Get the first data source (most databases will have only one)
    if (database.data_sources && database.data_sources.length > 0) {
      const dataSourceId = database.data_sources[0].id;
      // Cache the result
      dataSourceCache.set(databaseId, dataSourceId);
      return dataSourceId;
    } else {
      throw new Error(`No data sources found for database ${databaseId}`);
    }
  } catch (error) {
    console.error(`Error fetching data source for database ${databaseId}:`, error);
    throw error;
  }
}

// Routes
app.get('/api/test-simple', (req, res) => {
  res.json({ message: 'Simple test endpoint working!' });
});

app.get('/api/test-dynamic/:id', (req, res) => {
  res.json({ 
    message: 'Dynamic route working!', 
    id: req.params.id,
    url: req.url 
  });
});

app.get('/api/databases', async (req, res) => {
  try {
    const databases = [];
    
    // Get members database info
    try {
      const membersDb = await notion.databases.retrieve({ 
        database_id: CLUB_DATABASES.members 
      });
      
      databases.push({
        id: membersDb.id,
        title: membersDb.title?.[0]?.plain_text || 'Miembros del Club',
        description: membersDb.description?.[0]?.plain_text || 'Base de datos de miembros del club',
        created_time: membersDb.created_time,
        last_edited_time: membersDb.last_edited_time,
        url: membersDb.url,
        type: 'members',
        data_sources: membersDb.data_sources || []
      });
    } catch (error) {
      console.error('Error fetching members database:', error);
    }
    
    // Get achievements database info
    try {
      const achievementsDb = await notion.databases.retrieve({ 
        database_id: CLUB_DATABASES.achievements 
      });
      
      databases.push({
        id: achievementsDb.id,
        title: achievementsDb.title?.[0]?.plain_text || 'Logros del Club',
        description: achievementsDb.description?.[0]?.plain_text || 'Base de datos de logros del club',
        created_time: achievementsDb.created_time,
        last_edited_time: achievementsDb.last_edited_time,
        url: achievementsDb.url,
        type: 'achievements',
        data_sources: achievementsDb.data_sources || []
      });
    } catch (error) {
      console.error('Error fetching achievements database:', error);
    }
    
    res.json(databases);
  } catch (error) {
    console.error('Error fetching club databases:', error);
    res.status(500).json({ error: 'Failed to fetch club databases' });
  }
});

// Frontend routes for direct access
app.get('/logros', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/miembros', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Individual member profile route
app.get('/miembros/:id', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Normativa page route
app.get('/normativa', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API route for achievements database
app.get('/api/logros', async (req, res) => {
  try {
    const databaseId = CLUB_DATABASES.achievements;
    
    // Get database info
    const database = await notion.databases.retrieve({ 
      database_id: databaseId 
    });
    
    // Get data source ID for querying
    const dataSourceId = await getDataSourceId(databaseId);
    
    // Use data source query endpoint (migrated from databases.query)
    const response = await notion.request({
      method: 'post',
      path: `data_sources/${dataSourceId}/query`,
      body: {
        page_size: 100
      }
    });
    
    const databaseInfo = {
      id: database.id,
      title: database.title?.[0]?.plain_text || 'Logros del Club',
      description: database.description?.[0]?.plain_text || '',
      properties: database.properties,
      type: 'achievements',
      items: response.results.map(item => ({
        id: item.id,
        created_time: item.created_time,
        last_edited_time: item.last_edited_time,
        properties: item.properties
      }))
    };
    
    res.json(databaseInfo);
  } catch (error) {
    console.error('Error fetching achievements database:', error);
    res.status(500).json({ error: 'Failed to fetch achievements database' });
  }
});

// API route for individual achievement
app.get('/api/logros/:id', async (req, res) => {
  try {
    const achievementId = req.params.id;
    console.log('=== ACHIEVEMENT ENDPOINT CALLED ===');
    console.log('Fetching individual achievement with ID:', achievementId);
    console.log('Request params:', req.params);
    console.log('Request URL:', req.url);
    
    const response = await notion.pages.retrieve({
      page_id: achievementId
    });
    
    console.log('Achievement retrieved successfully from Notion API');
    console.log('Achievement data structure:', {
      id: response.id,
      object: response.object,
      hasProperties: !!response.properties,
      propertiesCount: response.properties ? Object.keys(response.properties).length : 0
    });
    
    res.json(response);
  } catch (error) {
    console.error('=== ERROR IN ACHIEVEMENT ENDPOINT ===');
    console.error('Error fetching achievement:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Error fetching achievement data', details: error.message });
  }
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  console.log('=== TEST ENDPOINT CALLED ===');
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/api/databases',
      '/api/logros',
      '/api/logros/:id',
      '/api/miembros',
      '/api/miembros/:id'
    ]
  });
});

// API route for members database
app.get('/api/miembros', async (req, res) => {
    try {
        console.log('Fetching members database...');
        
        const databaseId = CLUB_DATABASES.members;
        
        // First get the database info to include description and properties
        const database = await notion.databases.retrieve({ 
            database_id: databaseId 
        });
        
        // Get data source ID for querying
        const dataSourceId = await getDataSourceId(databaseId);
        
        // Use data source query endpoint (migrated from databases.query)
        const response = await notion.request({
            method: 'post',
            path: `data_sources/${dataSourceId}/query`,
            body: {
                page_size: 100
            }
        });
        
        console.log(`Found ${response.results.length} members`);
        
        const databaseInfo = {
            id: database.id,
            title: database.title?.[0]?.plain_text || 'Miembros del Club',
            description: database.description?.[0]?.plain_text || '',
            properties: database.properties,
            type: 'members',
            items: response.results.map(item => ({
                id: item.id,
                created_time: item.created_time,
                last_edited_time: item.last_edited_time,
                properties: item.properties
            }))
        };
        
        res.json(databaseInfo);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Error fetching members database' });
    }
});

// API route for individual member
app.get('/api/miembros/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        console.log('Fetching individual member:', memberId);
        
        const response = await notion.pages.retrieve({
            page_id: memberId
        });
        
        console.log('Member retrieved successfully');
        res.json(response);
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ error: 'Error fetching member data' });
    }
});

// Original database route for compatibility
app.get('/api/databases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the database ID is one of our club databases
    if (!Object.values(CLUB_DATABASES).includes(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    // Get database metadata
    const database = await notion.databases.retrieve({ database_id: id });
    
    // Get data source ID for querying
    const dataSourceId = await getDataSourceId(id);
    
    // Use data source query endpoint (migrated from databases.query)
    const response = await notion.request({
      method: 'post',
      path: `data_sources/${dataSourceId}/query`,
      body: {
        page_size: 100
      }
    });
    
    const databaseInfo = {
      id: database.id,
      title: database.title?.[0]?.plain_text || 'Untitled Database',
      description: database.description?.[0]?.plain_text || '',
      properties: database.properties,
      type: id === CLUB_DATABASES.members ? 'members' : 'achievements',
      items: response.results.map(item => ({
        id: item.id,
        created_time: item.created_time,
        last_edited_time: item.last_edited_time,
        properties: item.properties
      }))
    };
    
    res.json(databaseInfo);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ error: 'Failed to fetch database' });
  }
});

// API route to retrieve a private page
app.get('/api/pages/:id', async (req, res) => {
  try {
    const pageId = req.params.id;
    console.log('Fetching page:', pageId);
    
    // Retrieve the page
    const page = await notion.pages.retrieve({
      page_id: pageId
    });
    
    res.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    if (error.code === 'object_not_found') {
      res.status(404).json({ 
        error: 'Page not found or integration does not have access',
        message: 'Make sure the page is shared with your Notion integration'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch page', details: error.message });
    }
  }
});

// API route to get children of a page (list sub-pages)
app.get('/api/pages/:id/children', async (req, res) => {
  try {
    const pageId = req.params.id;
    const pageSize = parseInt(req.query.page_size) || 100;
    const startCursor = req.query.start_cursor || undefined;
    
    console.log('Fetching children of page:', pageId);
    
    // Get block children (this includes sub-pages)
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: pageSize,
      start_cursor: startCursor
    });
    
    // Filter to get only child pages (type: "child_page")
    const childPages = response.results.filter(block => block.type === 'child_page');
    
    // Also get regular blocks for content
    const contentBlocks = response.results.filter(block => block.type !== 'child_page');
    
    res.json({
      child_pages: childPages.map(page => ({
        id: page.id,
        title: page.child_page?.title || 'Untitled',
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        has_children: page.has_children
      })),
      content_blocks: contentBlocks.length,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
      total_children: response.results.length
    });
  } catch (error) {
    console.error('Error fetching page children:', error);
    if (error.code === 'object_not_found') {
      res.status(404).json({ 
        error: 'Page not found or integration does not have access',
        message: 'Make sure the page is shared with your Notion integration'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch page children', details: error.message });
    }
  }
});

// API route for the specific private page
app.get('/api/private-page', async (req, res) => {
  try {
    console.log('Fetching private page:', PRIVATE_PAGE_ID);
    
    // Retrieve the page
    const page = await notion.pages.retrieve({
      page_id: PRIVATE_PAGE_ID
    });
    
    // Get children (sub-pages and content)
    const children = await notion.blocks.children.list({
      block_id: PRIVATE_PAGE_ID,
      page_size: 100
    });
    
    const childPages = children.results.filter(block => block.type === 'child_page');
    
    res.json({
      page: {
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        url: page.url,
        properties: page.properties,
        icon: page.icon,
        cover: page.cover
      },
      child_pages: childPages.map(child => ({
        id: child.id,
        title: child.child_page?.title || 'Untitled',
        created_time: child.created_time,
        last_edited_time: child.last_edited_time,
        has_children: child.has_children
      })),
      total_children: children.results.length
    });
  } catch (error) {
    console.error('Error fetching private page:', error);
    if (error.code === 'object_not_found') {
      res.status(404).json({ 
        error: 'Page not found or integration does not have access',
        message: 'Make sure the page is shared with your Notion integration. See README for instructions.'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch private page', details: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Club databases configured:`);
  console.log(`- Members: ${CLUB_DATABASES.members}`);
  console.log(`- Achievements: ${CLUB_DATABASES.achievements}`);
  
  // Log all registered routes
  console.log('\n=== REGISTERED ROUTES ===');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  });
  console.log('=== END ROUTES ===\n');
}); 