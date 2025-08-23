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

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Club database IDs
const CLUB_DATABASES = {
  members: '16d03b7b-0a84-8037-8bf9-fbed98efe753',
  achievements: '24403b7b-0a84-80ee-9e6d-fe5d8ec10aee'
};

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
        type: 'members'
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
        type: 'achievements'
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

// API route for achievements database
app.get('/api/logros', async (req, res) => {
  try {
    const database = await notion.databases.retrieve({ 
      database_id: CLUB_DATABASES.achievements 
    });
    
    const response = await notion.databases.query({
      database_id: CLUB_DATABASES.achievements,
      page_size: 100
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
        
        // First get the database info to include description and properties
        const database = await notion.databases.retrieve({ 
            database_id: CLUB_DATABASES.members 
        });
        
        // Then query the database for items
        const response = await notion.databases.query({
            database_id: CLUB_DATABASES.members,
            page_size: 100
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
    
    // Get database contents (first 100 items)
    const response = await notion.databases.query({
      database_id: id,
      page_size: 100
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