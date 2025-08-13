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
        backBtn.addEventListener('click', showDatabasesList);
        console.log('Back button event listener added');
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
        
        console.log('Displaying databases...');
        displayDatabases(databases);
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
    console.log('Displaying database detail:', database);
    console.log('databaseTitle element:', databaseTitle);
    console.log('databaseContent element:', databaseContent);
    
    if (!databaseTitle || !databaseContent) {
        console.error('Required DOM elements not found!');
        return;
    }
    
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
    console.log('Setting content HTML...');
    databaseContent.innerHTML = content;
    console.log('Content HTML set successfully');
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

// Display members in card format with clickable cards
function displayMembersCards(items) {
    let cardsContent = '';
    
    items.forEach(item => {
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
        // Create the database detail structure
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div id="database-detail" class="database-detail">
                <div class="detail-header">
                    <button id="back-btn" class="back-btn">← Back to Club Databases</button>
                    <h2 id="database-title"></h2>
                </div>
                <div id="loading" class="loading">Loading members...</div>
                <div id="database-content"></div>
            </div>
        `;
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        loading.style.display = 'block';
        
        console.log('Fetching members from /api/miembros...');
        const response = await fetch('/api/miembros');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const database = await response.json();
        console.log('Members data:', database);
        
        // Set title and display content
        databaseTitle.textContent = database.title;
        displayDatabaseDetail(database);
        
    } catch (error) {
        console.error('Error loading members:', error);
        if (databaseContent) {
            databaseContent.innerHTML = `<p class="error">Error al cargar los miembros: ${error.message}</p>`;
        }
    } finally {
        if (loading) {
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
                    <h2 id="member-title">Cargando perfil...</h2>
                </div>
                <div id="loading" class="loading">Cargando perfil del miembro...</div>
                <div id="member-content"></div>
            </div>
        `;
        
        // Initialize DOM elements after creating HTML
        initializeDOMElements();
        
        if (loading) {
            loading.style.display = 'block';
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
        
        if (loading) {
            loading.style.display = 'none';
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

// Display member profile with all data
function displayMemberProfile(member) {
    console.log('Displaying member profile:', member);
    
    const memberContent = document.getElementById('member-content');
    if (!memberContent) {
        console.error('Member content element not found');
        return;
    }
    
    let profileContent = `
        <div class="member-profile-content">
            <div class="profile-section">
                <h3>Información del Miembro</h3>
                <div class="profile-grid">
    `;
    
    // Display all member properties in a grid
    Object.entries(member.properties).forEach(([name, property]) => {
        const value = extractPropertyValue(property);
        const isNameProperty = name.toLowerCase().includes('name') || 
                             name.toLowerCase().includes('nombre') || 
                             name.toLowerCase().includes('title');
        
        if (isNameProperty) {
            // Name property gets special styling
            profileContent += `
                <div class="profile-item name-item">
                    <div class="profile-label">${escapeHtml(name)}</div>
                    <div class="profile-value name-value">${escapeHtml(value)}</div>
                </div>
            `;
        } else if (property.type === 'multi_select') {
            // Multi-select properties get tag styling
            const tags = property.multi_select || [];
            if (tags.length > 0) {
                const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag.name)}</span>`).join('');
                profileContent += `
                    <div class="profile-item">
                        <div class="profile-label">${escapeHtml(name)}</div>
                        <div class="profile-value tags-value">${tagsHtml}</div>
                    </div>
                `;
            } else {
                profileContent += `
                    <div class="profile-item">
                        <div class="profile-label">${escapeHtml(name)}</div>
                        <div class="profile-value">No seleccionado</div>
                    </div>
                `;
            }
        } else {
            // Regular properties
            profileContent += `
                <div class="profile-item">
                    <div class="profile-label">${escapeHtml(name)}</div>
                    <div class="profile-value">${escapeHtml(value)}</div>
                </div>
            `;
        }
    });
    
    profileContent += `
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="action-btn" onclick="window.location.href='/miembros'">
                    ← Volver a Miembros
                </button>
            </div>
        </div>
    `;
    
    memberContent.innerHTML = profileContent;
    console.log('Member profile displayed successfully');
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