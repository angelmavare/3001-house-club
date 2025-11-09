const { Client } = require('@notionhq/client');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Notion client with API version 2025-09-03
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03',
});

// Club database IDs
const CLUB_DATABASES = {
  members: '16d03b7b-0a84-8037-8bf9-fbed98efe753',
  achievements: '24403b7b-0a84-80ee-9e6d-fe5d8ec10aee',
  routes: '12a03b7b-0a84-818c-94e6-000caef294fe'
};

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
    
    // Get routes database info
    try {
      const routesDb = await notion.databases.retrieve({ 
        database_id: CLUB_DATABASES.routes 
      });
      
      databases.push({
        id: routesDb.id,
        title: routesDb.title?.[0]?.plain_text || 'Bitácora de Rutas',
        description: routesDb.description?.[0]?.plain_text || 'Base de datos de bitácora de rutas del club',
        created_time: routesDb.created_time,
        last_edited_time: routesDb.last_edited_time,
        url: routesDb.url,
        type: 'routes',
        data_sources: routesDb.data_sources || []
      });
    } catch (error) {
      console.error('Error fetching routes database:', error);
    }
    
    res.json(databases);
  } catch (error) {
    console.error('Error fetching club databases:', error);
    res.status(500).json({ error: 'Failed to fetch club databases' });
  }
});

// API route for achievements database
app.get('/api/logros', async (req, res) => {
    try {
        console.log('Fetching achievements database...');
        const databaseId = CLUB_DATABASES.achievements;
        
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
        
        console.log(`Found ${response.results.length} achievements`);
        res.json({
            id: databaseId,
            title: 'Logros',
            type: 'achievements',
            items: response.results
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Error fetching achievements database' });
    }
});

// API route for individual achievement
app.get('/api/logros/:id', async (req, res) => {
    try {
        const achievementId = req.params.id;
        console.log('Fetching individual achievement:', achievementId);
        
        const response = await notion.pages.retrieve({
            page_id: achievementId
        });
        
        console.log('Achievement retrieved successfully');
        res.json(response);
    } catch (error) {
        console.error('Error fetching achievement:', error);
        res.status(500).json({ error: 'Error fetching achievement data' });
    }
});

// API route for routes database
app.get('/api/rutas', async (req, res) => {
    try {
        console.log('Fetching routes database...');
        const databaseId = CLUB_DATABASES.routes;
        
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
        
        console.log(`Found ${response.results.length} routes`);
        res.json({
            id: databaseId,
            title: 'Bitácora de Rutas',
            type: 'routes',
            items: response.results
        });
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Error fetching routes database' });
    }
});

// API route for individual route
app.get('/api/rutas/:id', async (req, res) => {
    try {
        const routeId = req.params.id;
        console.log('Fetching individual route:', routeId);
        
        const response = await notion.pages.retrieve({
            page_id: routeId
        });
        
        console.log('Route retrieved successfully');
        res.json(response);
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ error: 'Error fetching route data' });
    }
});

// API route for members database
app.get('/api/miembros', async (req, res) => {
    try {
        console.log('Fetching members database...');
        const databaseId = CLUB_DATABASES.members;
        
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
        res.json({
            id: databaseId,
            title: 'Miembros',
            type: 'members',
            items: response.results
        });
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
      type: id === CLUB_DATABASES.members ? 'members' : 
            id === CLUB_DATABASES.achievements ? 'achievements' : 'routes',
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

// Export the serverless handler
exports.handler = serverless(app); 