# 3001 Club House

A web application built with Express.js that showcases achievements and members from your Notion workspace using the Notion API.

## Features

- 🏆 **Achievements Database** - Display and browse club achievements
- 👥 **Members Database** - View and explore club members
- 🔍 **Smart Filtering** - Automatically detects achievements and members databases
- 📝 **Rich Content Display** - Shows all database properties and items
- 🎨 **Modern, responsive UI** with beautiful styling
- 📱 **Mobile-friendly** design

## Prerequisites

- Node.js (version 14 or higher)
- A Notion API key (Internal Integration)
- Access to a Notion workspace with achievements and/or members databases

## Setup

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your Notion API key**
   
   Create a `.env` file in the root directory with your Notion API key:
   ```env
   NOTION_API_KEY=your_notion_api_key_here
   PORT=3000
   ```
   
   **Important**: Replace `your_notion_api_key_here` with your actual Notion API key.

4. **Set up Notion Integration**
   
   - Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the "Internal Integration Token"
   - Add the integration to your workspace
   - Share your achievements and members databases with the integration

5. **Database Naming Requirements**
   
   For the application to automatically detect your databases, make sure they contain one of these keywords in the title or description:
   - **Achievements**: "logro", "achievement"
   - **Members**: "miembro", "member"

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/databases` - List only achievements and members databases
- `GET /api/databases/:id` - Get detailed information about a specific database

## Project Structure

```
├── server.js              # Express.js server with Notion API integration
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables (create this file)
├── env.example           # Example environment file
├── public/               # Frontend files
│   ├── index.html        # Main HTML page
│   ├── styles.css        # CSS styling
│   └── script.js         # Frontend JavaScript
└── README.md             # This file
```

## How It Works

1. **Backend (Express.js)**: 
   - Connects to Notion API using your integration token
   - Automatically filters databases to show only achievements and members
   - Provides REST endpoints to fetch filtered database information
   - Handles API responses and formats data for the frontend

2. **Frontend (HTML/CSS/JavaScript)**:
   - Displays only relevant club databases (achievements and members)
   - Shows visual indicators for each database type
   - Allows clicking on databases to view detailed information
   - Presents achievements and members data in an organized, club-focused layout

## Notion API Integration

This project uses the official Notion JavaScript SDK (`@notionhq/client`) to:
- Search for databases in your workspace
- Automatically filter for achievements and members databases
- Retrieve database metadata and structure
- Query database contents
- Handle different property types (text, numbers, dates, etc.)

## Database Detection

The application automatically identifies your databases based on keywords:

- **🏆 Achievements**: Databases with "logro" or "achievement" in title/description
- **👥 Members**: Databases with "miembro" or "member" in title/description

Other databases in your workspace will be hidden from the application.

## Security Notes

- **Never commit your `.env` file** to version control
- Your API key is stored server-side only
- The application is designed for internal use (not public-facing)
- Consider implementing authentication if you plan to make it public

## Troubleshooting

### Common Issues

1. **"No club databases found" error**
   - Check that your databases contain the required keywords
   - Ensure the integration has access to your workspace
   - Verify the integration has been shared with the databases

2. **Databases not showing up**
   - Make sure database titles/descriptions contain: "logro", "achievement", "miembro", or "member"
   - Check that the integration has been shared with the databases
   - Verify your API key has the correct permissions

3. **Port already in use**
   - Change the PORT in your `.env` file
   - Or kill the process using the current port

## Future Enhancements

- [ ] Add authentication system for public deployment
- [ ] Implement achievements filtering and search
- [ ] Add member profile pictures and contact information
- [ ] Create achievement badges and certificates
- [ ] Add member statistics and achievements tracking
- [ ] Real-time updates using Notion webhooks
- [ ] Export achievements and members data

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own purposes. 