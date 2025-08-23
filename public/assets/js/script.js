// DOM elements
let databasesList, databaseDetail, databasesContainer, loading, backBtn, databaseTitle, databaseContent, memberContent;

// Initialize DOM elements after content is loaded
function initializeDOMElements() {
    console.log('Initializing DOM elements...');
    
    databasesList = document.getElementById('databases-list');
    databaseDetail = document.getElementById('database-detail');
    databasesContainer = document.getElementById('databases-container');
    loading = document.getElementById('loading');
    backBtn = document.getElementById('back-btn');
    databaseTitle = document.getElementById('database-title');
    databaseContent = document.getElementById('database-content');
    memberContent = document.getElementById('member-content');
    
    console.log('DOM elements found:', {
        databasesList: !!databasesList,
        databaseDetail: !!databaseDetail,
        databasesContainer: !!databasesContainer,
        loading: !!loading,
        backBtn: !!backBtn,
        databaseTitle: !!databaseTitle,
        databaseContent: !!databaseContent,
        memberContent: !!memberContent
    });
    
    // Add event listeners if elements exist
    if (backBtn) {
        // Check if we're in a member profile context
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/miembros/')) {
            // In member profile, go back to members list
            backBtn.addEventListener('click', () => {
                window.location.href = '/miembros';
            });
            console.log('Back button configured for member profile');
        } else {
            // In database view, go back to main databases list
            backBtn.addEventListener('click', showDatabasesList);
            console.log('Back button configured for database view');
        }
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking current path...');
    
    // Check current path to determine what to load
    const currentPath = window.location.pathname;
    console.log('Current path:', currentPath);
    
    if (currentPath === '/') {
        console.log('Loading main databases view...');
        loadDatabases();
    } else if (currentPath === '/logros') {
        console.log('Loading achievements directly...');
        loadAchievementsDirectly();
    } else if (currentPath === '/miembros') {
        console.log('Loading members directly...');
        loadMembersDirectly();
    } else if (currentPath.startsWith('/miembros/')) {
        // Handle individual member profile route
        const memberId = currentPath.split('/')[2];
        console.log('Loading individual member profile for ID:', memberId);
        loadMemberProfileDirectly(memberId);
    } else {
        console.log('Unknown path, loading main view...');
        loadDatabases();
    }
});

// Update active navigation link
function updateActiveNavigation(currentPath) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (currentPath === '/' && link.getAttribute('href') === '/') {
            link.classList.add('active');
        } else if (currentPath === '/logros' && link.getAttribute('href') === '/logros') {
            link.classList.add('active');
        } else if (currentPath === '/miembros' && link.getAttribute('href') === '/miembros') {
            link.classList.add('active');
        }
    });
}

// Load all databases
async function loadDatabases() {
    try {
        console.log('Starting to load databases...');
        
        // Create the main page structure
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div id="databases-list" class="databases-section">
                <h2>Club Databases</h2>
                <div id="loading" class="loading">Loading club databases...</div>
                <div id="databases-container" class="databases-grid"></div>
            </div>
        `;
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
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
        
        // Store databases data in localStorage for later use
        try {
            localStorage.setItem('clubDatabases', JSON.stringify(databases));
            console.log('Databases data stored in localStorage');
        } catch (storageError) {
            console.warn('Could not store databases in localStorage:', storageError);
        }
        
        console.log('Displaying databases...');
        displayDatabases(databases);
        
        // Update active navigation for home page
        updateActiveNavigation('/');
    } catch (error) {
        console.error('Error loading databases:', error);
        if (databasesContainer) {
            databasesContainer.innerHTML = `<p class="error">Error al cargar las bases de datos del club: ${error.message}. Por favor verifica tu clave API y que las bases de datos estén disponibles.</p>`;
        }
    } finally {
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Display databases in a grid
function displayDatabases(databases) {
    console.log('Displaying databases:', databases);
    databasesContainer.innerHTML = databases.map(db => {
        const typeIcon = db.type === 'achievements' ? '<span class="material-symbols-outlined">emoji_events</span>' : '<span class="material-symbols-outlined">group</span>';
        const typeLabel = db.type === 'achievements' ? 'Logros' : 'Miembros';
        
        // Determine the route based on database type
        const route = db.type === 'achievements' ? '/logros' : '/miembros';
        
        return `
            <div class="database-card ${db.type}" onclick="navigateToRoute('${route}')">
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

// Get database description from localStorage
function getDatabaseDescriptionFromStorage(databaseId) {
    try {
        const storedDatabases = localStorage.getItem('clubDatabases');
        if (storedDatabases) {
            const databases = JSON.parse(storedDatabases);
            const database = databases.find(db => db.id === databaseId);
            return database ? database.description : null;
        }
    } catch (error) {
        console.warn('Error reading from localStorage:', error);
    }
    return null;
}

// Get database description from localStorage by type (for achievements and members)
function getDatabaseDescriptionByType(databaseType) {
    try {
        const storedDatabases = localStorage.getItem('clubDatabases');
        if (storedDatabases) {
            const databases = JSON.parse(storedDatabases);
            const database = databases.find(db => db.type === databaseType);
            return database ? database.description : null;
        }
    } catch (error) {
        console.warn('Error reading from localStorage:', error);
    }
    return null;
}

// Navigate to specific route
function navigateToRoute(route) {
    console.log('Navigating to route:', route);
    
    // Update URL
    window.history.pushState({ route }, '', route);
    
    // Update active navigation
    updateActiveNavigation(route);
    
    // Load the appropriate content based on route
    if (route === '/logros') {
        console.log('Loading achievements view...');
        loadAchievementsDirectly();
    } else if (route === '/miembros') {
        console.log('Loading members view...');
        loadMembersDirectly();
    } else {
        console.warn('Unknown route:', route);
    }
}

// View a specific database
async function viewDatabase(databaseId) {
    try {
        console.log('Viewing database:', databaseId);
        
        // Create the database detail structure
        const mainContent = document.getElementById('main-content');
        console.log('Main content element:', mainContent);
        
        mainContent.innerHTML = `
            <div id="database-detail" class="database-detail">
                <div class="detail-header">
                    <button id="back-btn" class="back-btn">← Back to Club Databases</button>
                    <h2 id="database-title"></h2>
                </div>
                <div id="loading" class="loading">Loading database...</div>
                <div id="database-content"></div>
            </div>
        `;
        
        console.log('HTML structure created, initializing DOM elements...');
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        console.log('DOM elements initialized, setting loading...');
        if (loading) {
            loading.style.display = 'block';
        }
        
        console.log('Fetching database data...');
        const response = await fetch(`/api/databases/${databaseId}`);
        const database = await response.json();
        console.log('Database data received:', database);
        
        console.log('Displaying database detail...');
        displayDatabaseDetail(database);
        
    } catch (error) {
        console.error('Error loading database:', error);
        if (databaseContent) {
            databaseContent.innerHTML = '<p class="error">Failed to load database details.</p>';
        }
    } finally {
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Display database details
function displayDatabaseDetail(database) {
    console.log('displayDatabaseDetail: Starting with database:', database);
    console.log('displayDatabaseDetail: databaseTitle element:', databaseTitle);
    console.log('displayDatabaseDetail: databaseContent element:', databaseContent);
    console.log('database general:', database);
    
    if (!databaseTitle || !databaseContent) {
        console.error('displayDatabaseDetail: Required DOM elements not found!');
        return;
    }
    
    console.log('displayDatabaseDetail: Setting title to:', database.title);
    databaseTitle.textContent = database.title;
    
    const typeLabel = database.type === 'achievements' ? '<span class="material-symbols-outlined">emoji_events</span> Base de Datos de Logros' : '<span class="material-symbols-outlined">group</span> Base de Datos de Miembros';
    const typeDescription = database.type === 'achievements' ? 'Logros del Club' : 'Miembros del Club';
    
    console.log('displayDatabaseDetail: Database type:', database.type);
    console.log('displayDatabaseDetail: Type label:', typeLabel);
    console.log('displayDatabaseDetail: Type description:', typeDescription);
    
    // Get description from localStorage if not available in database
    let description = database.description;
    if (!description && database.type) {
        description = getDatabaseDescriptionByType(database.type);
    }
    
    let content = `
        <div class="database-info">
            <div class="database-type-badge ${database.type}">
                ${typeLabel}
            </div>
            <p class="database-description">${escapeHtml(description || 'No description available')}</p>
        </div>
    `;
    
    // Properties section is now hidden for all database types
    console.log('displayDatabaseDetail: Properties section hidden for all database types');
    
    // Only show items section if items exist
    if (database.items && Array.isArray(database.items)) {
        content += `
            <div class="database-items">
                <h3>${typeDescription} (${database.items.length})</h3>
        `;
        
        // Display database items with different formats based on type
        if (database.items.length === 0) {
            content += `<p class="no-items">No se encontraron ${database.type === 'achievements' ? 'logros' : 'miembros'} en esta base de datos.</p>`;
        } else {
            if (database.type === 'achievements') {
                // Display achievements as a table
                console.log('displayDatabaseDetail: Displaying achievements table');
                console.log('displayDatabaseDetail: Database properties for achievements:', database.properties);
                console.log('displayDatabaseDetail: Number of achievement items:', database.items.length);
                content += displayAchievementsTable(database.items, database.properties || {});
            } else {
                // Display members in the current card format
                content += displayMembersCards(database.items);
            }
        }
        
        content += '</div>';
    } else {
        content += `
            <div class="database-items">
                <h3>${typeDescription}</h3>
                <p class="no-items">No se pudieron cargar los datos de la base de datos.</p>
            </div>
        `;
    }
    
    databaseContent.innerHTML = content;
}

// Display achievements as a table
function displayAchievementsTable(items, properties) {
    console.log('displayAchievementsTable: Starting with items:', items);
    console.log('displayAchievementsTable: Properties received:', properties);
    
    // Safety check for properties
    if (!properties || typeof properties !== 'object') {
        console.warn('displayAchievementsTable: No properties provided, using empty object');
        properties = {};
    }
    
    // Get property names for table headers
    const propertyNames = Object.keys(properties);
    console.log('displayAchievementsTable: Property names found:', propertyNames);
    
    // If no properties defined, create a fallback table structure
    if (propertyNames.length === 0) {
        console.log('displayAchievementsTable: No properties defined, creating fallback table');
        console.log('displayAchievementsTable: Number of items to display:', items.length);
        
        let fallbackTable = `
            <div class="table-container">
                <table class="achievements-table">
                    <thead>
                        <tr>
                            <th class="name-column">Título</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th>Dificultad</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Display achievements with fallback structure
        items.forEach(item => {
            fallbackTable += '<tr>';
            
            // Try to extract data from specific properties
            let achievementName = 'Sin título';
            let achievementDescription = 'Sin descripción';
            let achievementType = 'Sin tipo';
            let achievementDifficulty = 'Sin dificultad';
            
            if (item.properties) {
                // Look for name/title properties
                const nameProps = ['Name', 'Nombre', 'Title', 'Título'];
                for (const propName of nameProps) {
                    if (item.properties[propName]) {
                        achievementName = extractPropertyValue(item.properties[propName]);
                        break;
                    }
                }
                
                // Look for description properties
                const descProps = ['Descripción', 'Description', 'Detalles', 'Details'];
                for (const propName of descProps) {
                    if (item.properties[propName]) {
                        achievementDescription = extractPropertyValue(item.properties[propName]);
                        break;
                    }
                }
                
                // Look for type properties (multi-select)
                const typeProps = ['Tipo', 'Type', 'Category', 'Categoría'];
                for (const propName of typeProps) {
                    if (item.properties[propName]) {
                        const typeProperty = item.properties[propName];
                        if (typeProperty.type === 'multi_select' && typeProperty.multi_select) {
                            // Display as tags
                            const tags = typeProperty.multi_select;
                            if (tags.length > 0) {
                                achievementType = tags.map(tag => `<span class="tag">${escapeHtml(tag.name)}</span>`).join('');
                            } else {
                                achievementType = 'Sin tags';
                            }
                        } else {
                            achievementType = extractPropertyValue(typeProperty);
                        }
                        break;
                    }
                }
                
                // Look for difficulty properties
                const difficultyProps = ['Dificultad', 'Difficulty', 'Nivel', 'Level'];
                for (const propName of difficultyProps) {
                    if (item.properties[propName]) {
                        achievementDifficulty = extractPropertyValue(item.properties[propName]);
                        break;
                    }
                }
            }
            
            fallbackTable += `
                <td class="name-cell">${escapeHtml(achievementName)}</td>
                <td>${escapeHtml(achievementDescription)}</td>
                <td class="tags-cell">${achievementType}</td>
                <td>${escapeHtml(achievementDifficulty)}</td>
            `;
            
            fallbackTable += '</tr>';
        });
        
        fallbackTable += `
                    </tbody>
                </table>
            </div>
        `;
        
        return fallbackTable;
    }
    
    let tableContent = `
        <div class="table-container">
            <table class="achievements-table">
                <thead>
                    <tr>
    `;
    
    // Define priority columns in order
    const priorityColumns = [
        { names: ['Name', 'Nombre', 'Title', 'Título'], label: 'Título', class: 'name-column' },
        { names: ['Descripción', 'Description', 'Detalles', 'Details'], label: 'Descripción', class: '' },
        { names: ['Tipo', 'Type', 'Category', 'Categoría'], label: 'Tipo', class: 'tags-column' },
        { names: ['Dificultad', 'Difficulty', 'Nivel', 'Level'], label: 'Dificultad', class: '' }
    ];
    
    // Add priority columns first
    priorityColumns.forEach(priorityCol => {
        const foundProperty = propertyNames.find(propName => 
            priorityCol.names.some(name => propName.toLowerCase() === name.toLowerCase())
        );
        if (foundProperty) {
            const className = priorityCol.class ? ` class="${priorityCol.class}"` : '';
            tableContent += `<th${className}>${priorityCol.label}</th>`;
        }
    });
    
    // Add remaining columns
    propertyNames.forEach(propName => {
        const isPriorityColumn = priorityColumns.some(priorityCol => 
            priorityCol.names.some(name => propName.toLowerCase() === name.toLowerCase())
        );
        
        if (!isPriorityColumn) {
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
        
        // Add priority columns first in the same order
        priorityColumns.forEach(priorityCol => {
            const foundProperty = propertyNames.find(propName => 
                priorityCol.names.some(name => propName.toLowerCase() === name.toLowerCase())
            );
            
            if (foundProperty) {
                const property = item.properties[foundProperty];
                if (property) {
                    if (priorityCol.label === 'Tipo' && property.type === 'multi_select') {
                        // Display Tipo column as tags
                        const tags = property.multi_select || [];
                        if (tags.length > 0) {
                            const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag.name)}</span>`).join('');
                            tableContent += `<td class="tags-cell">${tagsHtml}</td>`;
                        } else {
                            tableContent += `<td class="tags-cell">Sin tags</td>`;
                        }
                    } else {
                        const value = extractPropertyValue(property);
                        const className = priorityCol.class ? ` class="${priorityCol.class}"` : '';
                        tableContent += `<td${className}>${escapeHtml(value)}</td>`;
                    }
                } else {
                    tableContent += `<td>No disponible</td>`;
                }
            }
        });
        
        // Add remaining columns
        propertyNames.forEach(propName => {
            const isPriorityColumn = priorityColumns.some(priorityCol => 
                priorityCol.names.some(name => propName.toLowerCase() === name.toLowerCase())
            );
            
            if (!isPriorityColumn) {
                const property = item.properties[propName];
                if (property) {
                    const value = extractPropertyValue(property);
                    tableContent += `<td>${escapeHtml(value)}</td>`;
                } else {
                    tableContent += `<td>No disponible</td>`;
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

// Sort members according to hierarchy and filter out retired members
function sortMembersByHierarchy(members) {
    // Define the hierarchy order (lower index = higher priority)
    const hierarchy = [
        'Presidente',
        'Vicepresidente', 
        'Sargento de armas',
        'Secretario',
        'Tesorero',
        'Capitan de ruta',
        'Full Patch',
        'Prospecto',
        'Hangaround',
        'Support'
    ];
    
    return members
        .filter(member => {
            // Filter out retired members
            if (!member.properties) return false;
            
            const typeProperty = member.properties.Tipo || member.properties.Type || member.properties.Category || member.properties['Tipo de miembro'];
            if (!typeProperty) return false;
            
            const memberType = extractPropertyValue(typeProperty);
            return memberType !== 'Retirado' && memberType !== 'Support';
        })
        .sort((a, b) => {
            // Get member types
            const typeA = a.properties.Tipo || a.properties.Type || a.properties.Category || a.properties['Tipo de miembro'];
            const typeB = b.properties.Tipo || b.properties.Type || b.properties.Category || b.properties['Tipo de miembro'];
            
            if (!typeA || !typeB) return 0;
            
            const memberTypeA = extractPropertyValue(typeA);
            const memberTypeB = extractPropertyValue(typeB);
            
            // Get hierarchy positions
            const positionA = hierarchy.indexOf(memberTypeA);
            const positionB = hierarchy.indexOf(memberTypeB);
            
            // If both are in hierarchy, sort by position
            if (positionA !== -1 && positionB !== -1) {
                return positionA - positionB;
            }
            
            // If only one is in hierarchy, prioritize the one in hierarchy
            if (positionA !== -1) return -1;
            if (positionB !== -1) return 1;
            
            // If neither is in hierarchy, maintain original order
            return 0;
        });
}

// Display members in card format with clickable cards
function displayMembersCards(items) {
    // Sort members by hierarchy first
    const sortedItems = sortMembersByHierarchy(items);
    
    let cardsContent = '';
    
    sortedItems.forEach(item => {
        // Safety check for item properties
        if (!item.properties || typeof item.properties !== 'object') {
            console.warn('displayMembersCards: Item has no properties:', item);
            cardsContent += `
                <div class="item-card members">
                    <div class="item-properties">
                        <div class="item-property">
                            <div class="item-property-label">Error</div>
                            <div class="item-property-value">No se pudieron cargar las propiedades del miembro</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Extract name and member type with safe fallbacks
        const nameProperty = item.properties.Name || item.properties.Nombre || item.properties.Title;
        const typeProperty = item.properties.Tipo || item.properties.Type || item.properties.Category || item.properties['Tipo de miembro'];
        
        const name = nameProperty ? extractPropertyValue(nameProperty) : 'Sin nombre';
        const memberType = typeProperty ? extractPropertyValue(typeProperty) : 'Sin tipo';
        
        cardsContent += `
            <div class="item-card members clickable" onclick="viewMemberProfile('${item.id}', '${escapeHtml(name)}')">
                <div class="card-header">
                    <h3 class="member-name">${escapeHtml(name)}</h3>
                    <span class="member-type-badge">${escapeHtml(memberType)}</span>
                </div>
                <div class="card-content">
                    <p class="member-description">${escapeHtml(memberType)}</p>
                </div>
                <div class="card-footer">
                    <span class="click-hint">Click para ver perfil completo</span>
                </div>
            </div>
        `;
    });
    
    return cardsContent;
}

// Extract readable value from Notion property
function extractPropertyValue(property) {
    // Safety check for undefined or null properties
    if (!property || typeof property !== 'object') {
        return 'No data';
    }
    
    switch (property.type) {
        case 'title':
            return property.title?.[0]?.plain_text || 'No title';
            
        case 'rich_text':
            return property.rich_text?.[0]?.plain_text || 'No text';
            
        case 'number':
            return property.number !== null && property.number !== undefined ? property.number : 'No number';
            
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
            
        case 'formula':
            // Handle formula properties - they can return different types
            if (property.formula) {
                switch (property.formula.type) {
                    case 'string':
                        return property.formula.string || 'No formula result';
                        
                    case 'number':
                        return property.formula.number !== null && property.formula.number !== undefined ? property.formula.number : 'No formula result';
                        
                    case 'boolean':
                        return property.formula.boolean ? 'Yes' : 'No';
                        
                    case 'date':
                        return property.formula.date ? formatDate(property.formula.date.start) : 'No date';
                        
                    default:
                        return 'Formula result unavailable';
                }
            }
            return 'No formula result';
            
        case 'rollup':
            // Handle rollup properties - they aggregate data from related databases
            if (property.rollup) {
                switch (property.rollup.type) {
                    case 'array':
                        // For array rollups (like multiple related items)
                        if (property.rollup.array && property.rollup.array.length > 0) {
                            // Extract the most relevant information from each item
                            const items = property.rollup.array.map(item => {
                                if (item.type === 'title' && item.title?.[0]?.plain_text) {
                                    return item.title[0].plain_text;
                                } else if (item.type === 'rich_text' && item.rich_text?.[0]?.plain_text) {
                                    return item.rich_text[0].plain_text;
                                } else if (item.type === 'select' && item.select?.name) {
                                    return item.select.name;
                                } else if (item.type === 'number' && item.number !== null) {
                                    return item.number;
                                } else {
                                    return 'Related item';
                                }
                            });
                            return items.join(', ');
                        }
                        return 'No related items';
                        
                    case 'number':
                        // For number rollups (like sums, counts, etc.)
                        return property.rollup.number !== null && property.rollup.number !== undefined ? property.rollup.number : 'No rollup result';
                        
                    case 'date':
                        // For date rollups (like earliest, latest dates)
                        if (property.rollup.date) {
                            return formatDate(property.rollup.date.start);
                        }
                        return 'No date rollup';
                        
                    default:
                        return 'Rollup data unavailable';
                }
            }
            return 'No rollup data';
            
        default:
            return 'Unsupported type';
    }
}

// Show databases list view
function showDatabasesList() {
    // Navigate back to the main page
    window.location.href = '/';
}

// Load achievements database directly
async function loadAchievementsDirectly() {
    try {
        // Create the database detail structure
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div id="database-detail" class="database-detail">
                <div class="detail-header">
                    <button id="back-btn" class="back-btn">← Back to Club Databases</button>
                    <h2 id="database-title"></h2>
                </div>
                <div id="loading" class="loading">Loading achievements...</div>
                <div id="database-content"></div>
            </div>
        `;
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        loading.style.display = 'block';
        
        console.log('Fetching achievements from /api/logros...');
        const response = await fetch('/api/logros');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const database = await response.json();
        console.log('Achievements data:', database);
        
        // Set title and display content
        databaseTitle.textContent = database.title;
        displayDatabaseDetail(database);
        
        // Update active navigation
        updateActiveNavigation('/logros');
        
    } catch (error) {
        console.error('Error loading achievements:', error);
        if (databaseContent) {
            databaseContent.innerHTML = `<p class="error">Error al cargar los logros: ${error.message}</p>`;
        }
    } finally {
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Load members database directly
async function loadMembersDirectly() {
    try {
        console.log('loadMembersDirectly: Starting...');
        
        // Create the database detail structure
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('loadMembersDirectly: Main content element not found');
            return;
        }
        
        console.log('loadMembersDirectly: Creating HTML structure...');
        mainContent.innerHTML = `
            <div id="database-detail" class="database-detail">
                <div class="detail-header">
                    <button id="back-btn" class="back-btn">← Volver a Club Databases</button>
                    <h2 id="database-title"></h2>
                </div>
                <div id="loading" class="loading">Loading members...</div>
                <div id="database-content"></div>
            </div>
        `;
        
        console.log('loadMembersDirectly: HTML structure created, initializing DOM elements...');
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        if (loading) {
            console.log('loadMembersDirectly: Setting loading to visible');
            loading.style.display = 'block';
        } else {
            console.warn('loadMembersDirectly: Loading element not found');
        }
        
        console.log('loadMembersDirectly: Fetching members from /api/miembros...');
        const response = await fetch('/api/miembros');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const database = await response.json();
        console.log('loadMembersDirectly: Members data received:', database);
        console.log('loadMembersDirectly: Database properties:', database.properties);
        console.log('loadMembersDirectly: Database items:', database.items);
        console.log('loadMembersDirectly: Database type:', database.type);
        console.log('loadMembersDirectly: Database title:', database.title);
        
        // Set title and display content
        if (databaseTitle) {
            databaseTitle.textContent = database.title;
            console.log('loadMembersDirectly: Title set to:', database.title);
        } else {
            console.warn('loadMembersDirectly: databaseTitle element not found');
        }
        
        console.log('loadMembersDirectly: Calling displayDatabaseDetail...');
        displayDatabaseDetail(database);
        
        // Update active navigation
        updateActiveNavigation('/miembros');
        
    } catch (error) {
        console.error('loadMembersDirectly: Error loading members:', error);
        if (databaseContent) {
            databaseContent.innerHTML = `<p class="error">Error al cargar los miembros: ${error.message}</p>`;
        }
    } finally {
        if (loading) {
            console.log('loadMembersDirectly: Hiding loading');
            loading.style.display = 'none';
        }
    }
}

// Load member profile directly from URL
async function loadMemberProfileDirectly(memberId) {
    try {
        console.log('Loading member profile directly for ID:', memberId);
        
        // Create the member profile structure
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div id="member-profile" class="member-profile">
                <div class="profile-header">
                    <button id="back-btn" class="back-btn">← Volver a Miembros</button>
                    <h2 id="member-title"><span id="member-title-text">Cargando perfil...</span></h2>
                </div>
                <div id="loading" class="loading">Cargando perfil del miembro...</div>
                <div id="member-content"></div>
            </div>
        `;
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        // Get the loading element from the newly created HTML
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        // Fetch member data
        console.log('Fetching member data from /api/miembros/' + memberId);
        const response = await fetch(`/api/miembros/${memberId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const member = await response.json();
        console.log('Member data received:', member);
        
        // Display member profile
        displayMemberProfile(member);
        
        // Update active navigation for members section
        updateActiveNavigation('/miembros');
        
        // Hide loading after successful display
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading member profile:', error);
        const memberContent = document.getElementById('member-content');
        if (memberContent) {
            memberContent.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar el perfil del miembro: ${error.message}</p>
                    <button onclick="window.location.href='/miembros'" class="action-btn">Volver a Miembros</button>
                </div>
            `;
        }
        
        // Hide loading on error as well
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// View member profile (updated to use proper URLs)
function viewMemberProfile(memberId, memberName) {
    console.log('Navigating to member profile:', memberId, memberName);
    
    // Update URL to show individual member profile
    const newUrl = `/miembros/${memberId}`;
    window.history.pushState({ memberId, memberName }, '', newUrl);
    
    // Load the member profile
    loadMemberProfileDirectly(memberId);
}

// Display member profile with specific data only
async function displayMemberProfile(member) {
    console.log('Displaying member profile:', member);
    
    const memberContent = document.getElementById('member-content');
    const memberTitle = document.getElementById('member-title-text');
    
    if (!memberContent) {
        console.error('Member content element not found');
        return;
    }
    
    // Extract member name for the title
    let memberName = 'Miembro del Club';
    Object.entries(member.properties).forEach(([name, property]) => {
        const isNameProperty = name.toLowerCase().includes('name') || 
                             name.toLowerCase().includes('nombre') || 
                             name.toLowerCase().includes('title');
        if (isNameProperty && memberName === 'Miembro del Club') {
            memberName = extractPropertyValue(property);
        }
    });
    
    // Update the member title in the header
    if (memberTitle) {
        memberTitle.textContent = memberName;
        console.log('Member title updated to:', memberName);
    }
    
    // Define the specific fields to display with their display names
    const fieldsToDisplay = [
        { key: 'name', displayName: 'Nombre', propertyNames: ['Name', 'Nombre', 'Title'] },
        { key: 'memberType', displayName: 'Tipo de miembro', propertyNames: ['Tipo', 'Type', 'Category', 'Tipo de miembro'] },
        { key: 'bloodType', displayName: 'Tipo de sangre', propertyNames: ['Tipo de sangre', 'Blood Type', 'Grupo sanguíneo'] },
        { key: 'joinDate', displayName: 'Fecha de ingreso', propertyNames: ['Fecha de ingreso', 'Join Date', 'Fecha de afiliación'] },
        { key: 'motorcycle', displayName: 'Moto', propertyNames: ['Moto', 'Motorcycle', 'Motocicleta'] },
        { key: 'totalKm', displayName: 'Total kilómetros recorridos', propertyNames: ['Total kilómetros recorridos', 'Total KM', 'Kilómetros totales'] },
        { key: 'participatedRoutes', displayName: 'Rutas participadas', propertyNames: ['Rutas participadas', 'Participated Routes', 'Rutas'] }
    ];
    
    let profileContent = `
        <div class="member-profile-content">
            <div class="profile-section">
                <h3>Información del Miembro</h3>
                <div class="profile-grid">
    `;
    
    // Display only the specific fields
    fieldsToDisplay.forEach(field => {
        let value = 'No disponible';
        let propertyFound = null;
        
        // Find the property in member properties
        for (const propertyName of field.propertyNames) {
            if (member.properties[propertyName]) {
                propertyFound = member.properties[propertyName];
                break;
            }
        }
        
        if (propertyFound) {
            value = extractPropertyValue(propertyFound);
        } else {
            console.warn(`No property found for field "${field.key}". Available properties:`, Object.keys(member.properties));
        }
        
        // Special styling for name field
        if (field.key === 'name') {
            profileContent += `
                <div class="profile-item name-item">
                    <div class="profile-label">${field.displayName}</div>
                    <div class="profile-value name-value">${escapeHtml(value)}</div>
                </div>
            `;
        } else if (field.key === 'memberType') {
            // Member type gets special styling with badge
            profileContent += `
                <div class="profile-item">
                    <div class="profile-label">${field.displayName}</div>
                    <div class="profile-value member-type-value">
                        <span class="member-type-badge">${escapeHtml(value)}</span>
                    </div>
                </div>
            `;
        } else if (field.key === 'participatedRoutes' && propertyFound && propertyFound.type === 'multi_select') {
            // Routes get tag styling
            const tags = propertyFound.multi_select || [];
            if (tags.length > 0) {
                const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag.name)}</span>`).join('');
                profileContent += `
                    <div class="profile-item">
                        <div class="profile-label">${field.displayName}</div>
                        <div class="profile-value tags-value">${tagsHtml}</div>
                    </div>
                `;
            } else {
                profileContent += `
                    <div class="profile-item">
                        <div class="profile-label">${field.displayName}</div>
                        <div class="profile-value">No hay rutas registradas</div>
                    </div>
                `;
            }
        } else {
            // Regular properties
            profileContent += `
                <div class="profile-item">
                    <div class="profile-label">${field.displayName}</div>
                    <div class="profile-value">${escapeHtml(value)}</div>
                </div>
            `;
        }
    });
    
    profileContent += `
                </div>
            </div>
            
            <!-- Achievements Section -->
            <div class="profile-section achievements-section">
                <h3><span class="material-symbols-outlined">emoji_events</span> Logros del Miembro</h3>
                <div class="achievements-container">
                    <div class="achievements-loading">
                        <p>Cargando logros...</p>
                    </div>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="action-btn" onclick="window.location.href='/miembros'">
                    ← Volver a Miembros
                </button>
            </div>
        </div>
    `;
    
    // Set the initial content with loading state
    memberContent.innerHTML = profileContent;
    
    // Handle achievements separately - they get their own section with individual cards
    // Look for the Logros property directly in member properties
    let achievementsProperty = null;
    const logrosPropertyNames = ['Logros', 'Achievements', 'Conquistas'];
    
    for (const propertyName of logrosPropertyNames) {
        if (member.properties[propertyName]) {
            achievementsProperty = member.properties[propertyName];
            console.log('Found achievements property:', propertyName, achievementsProperty);
            break;
        }
    }
    
    if (achievementsProperty && achievementsProperty.type === 'relation' && achievementsProperty.relation && achievementsProperty.relation.length > 0) {
        console.log('Found relation achievements:', achievementsProperty.relation);
        
        // Load achievements data for each relation ID and update the content
        const achievementsHTML = await loadAchievementsData(achievementsProperty.relation, memberContent);
        
        // Find the achievements container and replace loading state with actual content
        const achievementsContainer = memberContent.querySelector('.achievements-container');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = achievementsHTML;
            console.log('Achievements container updated with content');
        } else {
            console.error('Achievements container not found after setting content');
        }
    } else {
        console.log('No achievements found or not relation type:', achievementsProperty);
        const achievementsContainer = memberContent.querySelector('.achievements-container');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = `
                <div class="no-achievements">
                    <p>Este miembro aún no ha obtenido logros.</p>
                </div>
            `;
        }
    }
}

// Load achievements data for relation IDs and return HTML content
async function loadAchievementsData(relationArray, memberContent) {
    try {
        console.log('loadAchievementsData: Starting with relations:', relationArray);
        
        // Fetch each achievement by ID
        console.log('loadAchievementsData: Starting to fetch achievements...');
        const achievementPromises = relationArray.map(async (relation, index) => {
            try {
                console.log(`loadAchievementsData: Fetching achievement ${index + 1}/${relationArray.length} with ID:`, relation.id);
                const response = await fetch(`/api/logros/${relation.id}`);
                
                console.log(`loadAchievementsData: Response for achievement ${relation.id}:`, response);
                
                if (!response.ok) {
                    console.warn(`loadAchievementsData: Failed to fetch achievement ${relation.id}:`, response.status, response.statusText);
                    return null;
                }
                
                const achievement = await response.json();
                console.log(`loadAchievementsData: Achievement data received for ${relation.id}:`, achievement);
                return achievement;
            } catch (error) {
                console.error(`loadAchievementsData: Error fetching achievement ${relation.id}:`, error);
                return null;
            }
        });
        
        console.log('loadAchievementsData: All achievement promises created, waiting for results...');
        
        // Wait for all achievements to load
        const achievements = await Promise.all(achievementPromises);
        const validAchievements = achievements.filter(achievement => achievement !== null);
        
        console.log('loadAchievementsData: All achievements processed:', achievements);
        console.log('loadAchievementsData: Valid achievements:', validAchievements);
        
        if (validAchievements.length > 0) {
            console.log('loadAchievementsData: Creating achievement cards HTML...');
            // Create HTML for each achievement card
            const achievementsHTML = validAchievements.map((achievement, index) => {
                console.log(`loadAchievementsData: Creating card ${index + 1} for achievement:`, achievement);
                return createAchievementCardHTML(achievement);
            }).join('');
            
            console.log('loadAchievementsData: Achievements HTML created:', achievementsHTML);
            return achievementsHTML;
        } else {
            console.log('loadAchievementsData: No valid achievements to display');
            return `
                <div class="no-achievements">
                    <p>No se pudieron cargar los logros.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('loadAchievementsData: Error in main function:', error);
        return `
            <div class="no-achievements">
                <p>Error al cargar los logros: ${error.message}</p>
            </div>
        `;
    }
}

// Create an achievement card element
function createAchievementCard(achievement) {
    console.log('createAchievementCard: Creating card for achievement:', achievement);
    
    const card = document.createElement('div');
    card.className = 'achievement-card';
    console.log('createAchievementCard: Card element created with class:', card.className);
    
    // Extract achievement title from properties
    let title = 'Logro sin título';
    if (achievement.properties) {
        console.log('createAchievementCard: Achievement properties:', achievement.properties);
        // Look for title properties
        const titleProperty = achievement.properties.Name || achievement.properties.Nombre || achievement.properties.Title;
        if (titleProperty) {
            title = extractPropertyValue(titleProperty);
            console.log('createAchievementCard: Extracted title:', title);
        } else {
            console.log('createAchievementCard: No title property found');
        }
    } else {
        console.log('createAchievementCard: No properties found in achievement');
    }
    
    // Extract achievement description if available
    let description = 'Logro obtenido por el miembro';
    if (achievement.properties) {
        const descProperty = achievement.properties.Descripción || achievement.properties.Description || achievement.properties.Detalles;
        if (descProperty) {
            description = extractPropertyValue(descProperty);
            console.log('createAchievementCard: Extracted description:', description);
        } else {
            console.log('createAchievementCard: No description property found');
        }
    }
    
    const cardHTML = `
        <div class="achievement-header">
            <span class="achievement-icon">🏆</span>
            <h4 class="achievement-title">${escapeHtml(title)}</h4>
        </div>
        <div class="achievement-content">
            <p class="achievement-description">${escapeHtml(description)}</p>
        </div>
    `;
    
    console.log('createAchievementCard: Card HTML created:', cardHTML);
    card.innerHTML = cardHTML;
    
    console.log('createAchievementCard: Card element created:', card);
    console.log('createAchievementCard: Card innerHTML:', card.innerHTML);
    console.log('createAchievementCard: Card outerHTML:', card.outerHTML);
    
    return card;
}

// Create an achievement card HTML string
function createAchievementCardHTML(achievement) {
    console.log('createAchievementCardHTML: Creating HTML for achievement:', achievement);
    
    // Extract achievement title from properties
    let title = 'Logro sin título';
    if (achievement.properties) {
        console.log('createAchievementCardHTML: Achievement properties:', achievement.properties);
        // Look for title properties
        const titleProperty = achievement.properties.Name || achievement.properties.Nombre || achievement.properties.Title;
        if (titleProperty) {
            title = extractPropertyValue(titleProperty);
            console.log('createAchievementCardHTML: Extracted title:', title);
        } else {
            console.log('createAchievementCardHTML: No title property found');
        }
    } else {
        console.log('createAchievementCardHTML: No properties found in achievement');
    }
    
    // Extract achievement description if available
    let description = 'Logro obtenido por el miembro';
    if (achievement.properties) {
        const descProperty = achievement.properties.Descripción || achievement.properties.Description || achievement.properties.Detalles;
        if (descProperty) {
            description = extractPropertyValue(descProperty);
            console.log('createAchievementCardHTML: Extracted description:', description);
        } else {
            console.log('createAchievementCardHTML: No description property found');
        }
    }
    
    const cardHTML = `
        <div class="achievement-card">
            <div class="achievement-header">
                <span class="material-symbols-outlined">emoji_events</span>
                <h4 class="achievement-title">${escapeHtml(title)}</h4>
            </div>
            <div class="achievement-content">
                <p class="achievement-description">${escapeHtml(description)}</p>
            </div>
        </div>
    `;
    
    console.log('createAchievementCardHTML: HTML created:', cardHTML);
    return cardHTML;
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