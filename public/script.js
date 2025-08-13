// DOM elements
const databasesList = document.getElementById('databases-list');
const databaseDetail = document.getElementById('database-detail');
const databasesContainer = document.getElementById('databases-container');
const loading = document.getElementById('loading');
const backBtn = document.getElementById('back-btn');
const databaseTitle = document.getElementById('database-title');
const databaseContent = document.getElementById('database-content');

// Event listeners
backBtn.addEventListener('click', showDatabasesList);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    loadDatabases();
});

// Load all databases
async function loadDatabases() {
    try {
        console.log('Starting to load databases...');
        loading.style.display = 'block';
        databasesContainer.innerHTML = '';
        
        console.log('Fetching from /api/databases...');
        const response = await fetch('/api/databases');
        console.log('Response received:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const databases = await response.json();
        console.log('Databases data:', databases);
        
        if (databases.length === 0) {
            console.log('No databases found');
            databasesContainer.innerHTML = '<p class="error">No se pudieron cargar las bases de datos del club. Verifica que las bases de datos de Miembros y Logros estén disponibles.</p>';
            return;
        }
        
        console.log('Displaying databases...');
        displayDatabases(databases);
    } catch (error) {
        console.error('Error loading databases:', error);
        databasesContainer.innerHTML = `<p class="error">Error al cargar las bases de datos del club: ${error.message}. Por favor verifica tu clave API y que las bases de datos estén disponibles.</p>`;
    } finally {
        loading.style.display = 'none';
    }
}

// Display databases in a grid
function displayDatabases(databases) {
    console.log('Displaying databases:', databases);
    databasesContainer.innerHTML = databases.map(db => {
        const typeIcon = db.type === 'achievements' ? '🏆' : '👥';
        const typeLabel = db.type === 'achievements' ? 'Logros' : 'Miembros';
        
        return `
            <div class="database-card ${db.type}" onclick="viewDatabase('${db.id}')">
                <div class="card-header">
                    <span class="type-icon">${typeIcon}</span>
                    <span class="type-label">${typeLabel}</span>
                </div>
                <h3>${escapeHtml(db.title)}</h3>
                <p>${escapeHtml(db.description || 'No description available')}</p>
                <div class="database-meta">
                    <span>Created: ${formatDate(db.created_time)}</span>
                    <span>Updated: ${formatDate(db.last_edited_time)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// View a specific database
async function viewDatabase(databaseId) {
    try {
        console.log('Viewing database:', databaseId);
        loading.style.display = 'block';
        
        const response = await fetch(`/api/databases/${databaseId}`);
        const database = await response.json();
        
        displayDatabaseDetail(database);
        showDatabaseDetail();
    } catch (error) {
        console.error('Error loading database:', error);
        databaseContent.innerHTML = '<p class="error">Failed to load database details.</p>';
        showDatabaseDetail();
    } finally {
        loading.style.display = 'none';
    }
}

// Display database details
function displayDatabaseDetail(database) {
    console.log('Displaying database detail:', database);
    databaseTitle.textContent = database.title;
    
    const typeLabel = database.type === 'achievements' ? '🏆 Base de Datos de Logros' : '👥 Base de Datos de Miembros';
    const typeDescription = database.type === 'achievements' ? 'Logros del Club' : 'Miembros del Club';
    
    let content = `
        <div class="database-info">
            <div class="database-type-badge ${database.type}">
                ${typeLabel}
            </div>
            <p class="database-description">${escapeHtml(database.description || 'No description available')}</p>
        </div>
        
        <div class="database-properties">
            <h3>Estructura de la Base de Datos</h3>
            <div class="properties-grid">
    `;
    
    // Display database properties
    Object.entries(database.properties).forEach(([name, property]) => {
        content += `
            <div class="property-item">
                <div class="property-name">${escapeHtml(name)}</div>
                <div class="property-type">${property.type}</div>
            </div>
        `;
    });
    
    content += `
            </div>
        </div>
        
        <div class="database-items">
            <h3>${typeDescription} (${database.items.length})</h3>
    `;
    
    // Display database items with different formats based on type
    if (database.items.length === 0) {
        content += `<p class="no-items">No se encontraron ${database.type === 'achievements' ? 'logros' : 'miembros'} en esta base de datos.</p>`;
    } else {
        if (database.type === 'achievements') {
            // Display achievements as a table
            content += displayAchievementsTable(database.items, database.properties);
        } else {
            // Display members in the current card format
            content += displayMembersCards(database.items);
        }
    }
    
    content += '</div>';
    databaseContent.innerHTML = content;
}

// Display achievements as a table
function displayAchievementsTable(items, properties) {
    // Get property names for table headers
    const propertyNames = Object.keys(properties);
    
    let tableContent = `
        <div class="table-container">
            <table class="achievements-table">
                <thead>
                    <tr>
    `;
    
    // Create table headers
    propertyNames.forEach(propName => {
        const isNameColumn = propName.toLowerCase().includes('name') || 
                           propName.toLowerCase().includes('nombre') ||
                           propName.toLowerCase().includes('title') ||
                           propName.toLowerCase().includes('título');
        
        if (isNameColumn) {
            // Name column first
            tableContent += `<th class="name-column">${escapeHtml(propName)}</th>`;
        }
    });
    
    // Add other columns
    propertyNames.forEach(propName => {
        const isNameColumn = propName.toLowerCase().includes('name') || 
                           propName.toLowerCase().includes('nombre') ||
                           propName.toLowerCase().includes('title') ||
                           propName.toLowerCase().includes('título');
        
        if (!isNameColumn) {
            tableContent += `<th>${escapeHtml(propName)}</th>`;
        }
    });
    
    tableContent += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Create table rows
    items.forEach(item => {
        tableContent += '<tr>';
        
        // Add name column first
        propertyNames.forEach(propName => {
            const isNameColumn = propName.toLowerCase().includes('name') || 
                               propName.toLowerCase().includes('nombre') ||
                               propName.toLowerCase().includes('title') ||
                               propName.toLowerCase().includes('título');
            
            if (isNameColumn) {
                const value = extractPropertyValue(item.properties[propName]);
                tableContent += `<td class="name-cell">${escapeHtml(value)}</td>`;
            }
        });
        
        // Add other columns
        propertyNames.forEach(propName => {
            const isNameColumn = propName.toLowerCase().includes('name') || 
                               propName.toLowerCase().includes('nombre') ||
                               propName.toLowerCase().includes('title') ||
                               propName.toLowerCase().includes('título');
            
            if (!isNameColumn) {
                const isTipoColumn = propName.toLowerCase().includes('tipo') || 
                                   propName.toLowerCase().includes('type') ||
                                   propName.toLowerCase().includes('category') ||
                                   propName.toLowerCase().includes('categoría');
                
                if (isTipoColumn && item.properties[propName]?.type === 'multi_select') {
                    // Display Tipo column as tags
                    const tags = item.properties[propName].multi_select || [];
                    if (tags.length > 0) {
                        const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag.name)}</span>`).join('');
                        tableContent += `<td class="tags-cell">${tagsHtml}</td>`;
                    } else {
                        tableContent += `<td class="tags-cell">No tags</td>`;
                    }
                } else {
                    const value = extractPropertyValue(item.properties[propName]);
                    tableContent += `<td>${escapeHtml(value)}</td>`;
                }
            }
        });
        
        tableContent += '</tr>';
    });
    
    tableContent += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableContent;
}

// Display members in card format (existing functionality)
function displayMembersCards(items) {
    let cardsContent = '';
    
    items.forEach(item => {
        cardsContent += `
            <div class="item-card members">
                <div class="item-properties">
        `;
        
        Object.entries(item.properties).forEach(([name, property]) => {
            const value = extractPropertyValue(property);
            cardsContent += `
                <div class="item-property">
                    <div class="item-property-label">${escapeHtml(name)}</div>
                    <div class="item-property-value">${escapeHtml(value)}</div>
                </div>
            `;
        });
        
        cardsContent += `
                </div>
            </div>
        `;
    });
    
    return cardsContent;
}

// Extract readable value from Notion property
function extractPropertyValue(property) {
    switch (property.type) {
        case 'title':
            return property.title?.[0]?.plain_text || 'No title';
        case 'rich_text':
            return property.rich_text?.[0]?.plain_text || 'No text';
        case 'number':
            return property.number || 'No number';
        case 'select':
            return property.select?.name || 'No selection';
        case 'multi_select':
            // Special handling for "Tipo" column - display as tags
            if (property.multi_select && property.multi_select.length > 0) {
                return property.multi_select.map(s => s.name).join(', ');
            }
            return 'No selections';
        case 'date':
            return property.date ? formatDate(property.date.start) : 'No date';
        case 'checkbox':
            return property.checkbox ? 'Yes' : 'No';
        case 'url':
            return property.url || 'No URL';
        case 'email':
            return property.email || 'No email';
        case 'phone_number':
            return property.phone_number || 'No phone';
        default:
            return 'Unsupported type';
    }
}

// Show database detail view
function showDatabaseDetail() {
    databasesList.style.display = 'none';
    databaseDetail.classList.remove('hidden');
}

// Show databases list view
function showDatabasesList() {
    databaseDetail.classList.add('hidden');
    databasesList.style.display = 'block';
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}