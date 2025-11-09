// Simple test script to verify local setup
const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testNotionConnection() {
    console.log('Testing Notion API connection...');
    
    if (!process.env.NOTION_API_KEY) {
        console.error('❌ NOTION_API_KEY not found in environment variables');
        console.log('Please create a .env file with your Notion API key');
        return;
    }
    
    const notion = new Client({
        auth: process.env.NOTION_API_KEY,
        notionVersion: '2025-09-03',
    });
    
    try {
        // Test with members database
        const membersDb = await notion.databases.retrieve({ 
            database_id: '16d03b7b-0a84-8037-8bf9-fbed98efe753' 
        });
        
        console.log('✅ Successfully connected to Notion API');
        console.log('📊 Members database title:', membersDb.title?.[0]?.plain_text || 'Untitled');
        
        // Test with achievements database
        const achievementsDb = await notion.databases.retrieve({ 
            database_id: '24403b7b-0a84-80ee-9e6d-fe5d8ec10aee' 
        });
        
        console.log('📊 Achievements database title:', achievementsDb.title?.[0]?.plain_text || 'Untitled');
        console.log('\n🎉 All tests passed! Your setup is ready for deployment.');
        
    } catch (error) {
        console.error('❌ Error connecting to Notion API:', error.message);
        console.log('\nPlease check:');
        console.log('1. Your Notion API key is correct');
        console.log('2. The database IDs are correct');
        console.log('3. Your Notion integration has access to the databases');
    }
}

testNotionConnection(); 