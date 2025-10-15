// S.A.C - Social Alignment Chart
let people = [];
let chart = null;

// Load people from Firestore on startup
async function loadPeople() {
    try {
        // Wait for Firebase to be ready
        if (!window.firebaseReady) {
            console.log('⏳ Waiting for Firebase to initialize...');
            await new Promise(resolve => {
                window.addEventListener('firebaseReady', resolve, { once: true });
            });
        }

        console.log('📥 Loading people from Firestore...');
        const querySnapshot = await window.db.collection('people').get();

        // Clear existing people array
        people = [];

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();

            // Load image from stored data URL if available
            if (data.imageDataUrl) {
                const img = new Image();
                img.src = data.imageDataUrl;
                data.image = img;
            } else {
                const image = await fetchTwitterPFP(data.handle);
                data.image = image;
            }

            // Store the document ID for potential deletion
            data.id = docSnap.id;
            people.push(data);
        }

        // Redraw chart after all people are loaded
        const canvas = document.getElementById('burnChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawChart(ctx, canvas.width, canvas.height);
            updatePersonList();
        }

        console.log(`✅ Loaded ${people.length} people from Firestore`);
    } catch (error) {
        console.error('❌ Error loading people from Firestore:', error);
    }
}

// Save person to Firestore
async function savePerson(person) {
    try {
        // Wait for Firebase if not ready
        if (!window.firebaseReady) {
            console.log('⏳ Waiting for Firebase before saving...');
            await new Promise(resolve => {
                window.addEventListener('firebaseReady', resolve, { once: true });
            });
        }

        // Create a copy without the image object but with imageDataUrl
        const toSave = {
            handle: person.handle,
            foodScore: person.foodScore,
            character: person.character,
            socialScore: person.socialScore,
            imageDataUrl: person.imageDataUrl,
            timestamp: new Date().toISOString()
        };

        console.log('💾 Saving person to Firestore:', toSave);
        const docRef = await window.db.collection('people').add(toSave);
        console.log('✅ Person saved to Firestore with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving person to Firestore:', error);
        console.error('Error details:', error.message);
        throw error;
    }
}

// Color palette - Bubbly and bold
const colors = {
    primary: '#FF1493', // Hot pink
    secondary: '#FF69B4', // Bright pink
    tertiary: '#9B59B6', // Purple
    accent1: '#E91E63', // Deep pink
    accent2: '#F06292', // Medium pink
    accent3: '#FCE4EC' // Light pink
};

// Initialize chart
function initChart() {
    const canvas = document.getElementById('burnChart');
    const ctx = canvas.getContext('2d');

    // Set canvas size to full container width
    const container = canvas.parentElement;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // On mobile, use full available width minus minimal padding
        canvas.width = container.clientWidth - 10;
    } else {
        // On desktop, use full container width
        canvas.width = container.clientWidth - 40; // Subtract padding
    }

    canvas.height = 700;

    drawChart(ctx, canvas.width, canvas.height);
}

// Draw the chart
function drawChart(ctx, width, height) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up padding (reduced for more chart space)
    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 35 : 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw background
    ctx.fillStyle = colors.accent3;
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = colors.accent1;
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(padding + (chartWidth / 10) * i, padding);
        ctx.lineTo(padding + (chartWidth / 10) * i, padding + chartHeight);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(padding, padding + (chartHeight / 10) * i);
        ctx.lineTo(padding + chartWidth, padding + (chartHeight / 10) * i);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;

    // X-axis (center horizontal)
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight / 2);
    ctx.lineTo(padding + chartWidth, padding + chartHeight / 2);
    ctx.stroke();

    // Y-axis (center vertical)
    ctx.beginPath();
    ctx.moveTo(padding + chartWidth / 2, padding);
    ctx.lineTo(padding + chartWidth / 2, padding + chartHeight);
    ctx.stroke();

    // Draw labels with smaller fonts
    ctx.fillStyle = colors.tertiary;
    const labelFontSize = isMobile ? 9 : 11;
    ctx.font = `bold ${labelFontSize}px Georgia`;
    ctx.textAlign = 'center';

    // X-axis labels
    const xLabelY = isMobile ? height - 15 : height - 25;
    ctx.fillText('Dietary Restrictions', padding + chartWidth * 0.15, xLabelY);
    ctx.fillText('Epicurean', padding + chartWidth * 0.85, xLabelY);

    // Y-axis labels
    const yLabelOffset = isMobile ? 12 : 20;
    ctx.save();
    ctx.translate(yLabelOffset, padding + chartHeight * 0.15);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pristine', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(yLabelOffset, padding + chartHeight * 0.85);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Cunt', 0, 0);
    ctx.restore();

    // Draw axis numbers with smaller font
    const numberFontSize = isMobile ? 8 : 10;
    ctx.font = `${numberFontSize}px Georgia`;
    ctx.fillStyle = colors.tertiary;

    // X-axis numbers
    const xNumberY = isMobile ? height - 5 : height - 10;
    ctx.fillText('-50', padding, xNumberY);
    ctx.fillText('0', padding + chartWidth / 2, xNumberY);
    ctx.fillText('50', padding + chartWidth, xNumberY);

    // Y-axis numbers
    ctx.textAlign = 'right';
    const yNumberOffset = isMobile ? 5 : 8;
    ctx.fillText('50', padding - yNumberOffset, padding + 5);
    ctx.fillText('0', padding - yNumberOffset, padding + chartHeight / 2 + 5);
    ctx.fillText('-50', padding - yNumberOffset, padding + chartHeight + 5);

    // Draw people on chart with collision detection
    console.log('Drawing', people.length, 'people on chart');

    // Track occupied positions to detect overlaps
    const positions = [];
    const minDistance = isMobile ? 25 : 30; // Minimum distance between avatars (using isMobile from above)

    people.forEach((person, index) => {
        console.log(`Drawing person ${index}:`, person.handle, 'foodScore:', person.foodScore, 'character:', person.character);

        // Calculate base position
        let baseX = padding + ((person.foodScore + 50) / 100) * chartWidth;
        let baseY = padding + ((50 - person.character) / 100) * chartHeight;

        let offsetX = 0;
        let offsetY = 0;
        let finalX = baseX;
        let finalY = baseY;

        // Check for collisions with existing positions
        let collision = true;
        let attempts = 0;
        const maxAttempts = 30;

        while (collision && attempts < maxAttempts) {
            collision = false;

            for (const pos of positions) {
                const distance = Math.sqrt(Math.pow(finalX - pos.x, 2) + Math.pow(finalY - pos.y, 2));
                if (distance < minDistance) {
                    collision = true;
                    // Offset in a spiral pattern for better distribution
                    const angle = (attempts / maxAttempts) * Math.PI * 4; // More rotations
                    const radius = minDistance * (1 + attempts / maxAttempts); // Expanding spiral
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
                    finalX = baseX + offsetX;
                    finalY = baseY + offsetY;
                    break;
                }
            }

            attempts++;
        }

        // Store the final position
        positions.push({ x: finalX, y: finalY });

        // Draw with offset
        drawPersonOnChart(ctx, person, padding, chartWidth, chartHeight, offsetX, offsetY);
    });
}

// Draw person on chart
function drawPersonOnChart(ctx, person, padding, chartWidth, chartHeight, offsetX = 0, offsetY = 0) {
    // Convert coordinates (-50 to 50) to canvas coordinates
    let x = padding + ((person.foodScore + 50) / 100) * chartWidth;
    let y = padding + ((50 - person.character) / 100) * chartHeight; // Inverted Y

    // Apply offset to prevent overlapping
    x += offsetX;
    y += offsetY;

    console.log(`Positioning ${person.handle} at x:${x}, y:${y}`);

    // Smaller avatar size for less clutter
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 20 : 25;
    const radius = size / 2;

    // Draw profile picture if available
    if (person.image) {
        const img = person.image;

        // Draw circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image
        ctx.drawImage(img, x - radius, y - radius, size, size);
        ctx.restore();

        // Draw border around image
        ctx.strokeStyle = getScoreColor(person.socialScore);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Draw circle placeholder
        ctx.fillStyle = colors.accent1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = getScoreColor(person.socialScore);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Don't draw handle or score on chart anymore - only show avatar
}

// Calculate social score based on position
function calculateSocialScore(foodScore, character) {
    // Formula: weight character more heavily, add some food score factor
    // Pristine character (high) and Epicurean (high food tolerance) = positive score
    // Cunt character (low) and Dietary restrictions (low food tolerance) = negative score

    const characterWeight = 0.7;
    const foodWeight = 0.3;

    const score = (character * characterWeight) + (foodScore * foodWeight);

    return Math.round(score * 2); // Scale to -100 to 100
}

// Get color based on score
function getScoreColor(score) {
    if (score > 50) return colors.primary;
    if (score > 0) return colors.secondary;
    if (score > -50) return colors.tertiary;
    return '#666';
}

// Load uploaded image file
async function loadImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Fetch Twitter profile picture (fallback if no image uploaded)
async function fetchTwitterPFP(handle) {
    // Remove @ if present
    const username = handle.replace('@', '');

    try {
        // Use a placeholder service
        const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=200&background=${colors.accent1.replace('#', '')}&color=fff&bold=true`;

        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';

        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Fallback to placeholder
                resolve(null);
            };
            img.src = placeholderUrl;
        });
    } catch (error) {
        console.error('Error fetching profile picture:', error);
        return null;
    }
}

// Check authentication status and show/hide overlay
function checkAuth() {
    const overlay = document.getElementById('loginOverlay');
    if (sessionStorage.getItem('authenticated')) {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.remove('hidden');
    }
}

// Handle login button click
document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    // Check auth on page load
    checkAuth();

    // Check auth periodically in case user logs in from another tab
    setInterval(checkAuth, 1000);
});

// Add person to chart
async function addPerson() {
    console.log('addPerson called');

    const handleInput = document.getElementById('twitterHandle');
    const profilePicInput = document.getElementById('profilePic');
    const foodInput = document.getElementById('foodScore');
    const characterInput = document.getElementById('character');

    console.log('Inputs found:', {
        handleInput: !!handleInput,
        profilePicInput: !!profilePicInput,
        foodInput: !!foodInput,
        characterInput: !!characterInput
    });

    const handle = handleInput.value.trim();
    const foodScore = parseInt(foodInput.value);
    const character = parseInt(characterInput.value);

    console.log('Values:', { handle, foodScore, character });

    // Validation
    if (!handle) {
        alert('Please enter a Twitter/X handle!');
        return;
    }

    if (isNaN(foodScore) || foodScore < -50 || foodScore > 50) {
        alert('Food score must be between -50 and 50!');
        return;
    }

    if (isNaN(character) || character < -50 || character > 50) {
        alert('Character must be between -50 and 50!');
        return;
    }

    // Calculate social score
    const socialScore = calculateSocialScore(foodScore, character);

    // Load profile picture
    let image = null;
    let imageDataUrl = null;

    if (profilePicInput.files && profilePicInput.files[0]) {
        try {
            image = await loadImageFile(profilePicInput.files[0]);
            imageDataUrl = image.src; // Store the data URL for localStorage
        } catch (error) {
            console.error('Error loading image:', error);
            image = await fetchTwitterPFP(handle);
        }
    } else {
        image = await fetchTwitterPFP(handle);
        if (image) {
            imageDataUrl = image.src;
        }
    }

    // Create person object
    const person = {
        handle: handle.startsWith('@') ? handle : '@' + handle,
        foodScore,
        character,
        socialScore,
        image,
        imageDataUrl // Store for localStorage
    };

    // Add to people array
    people.push(person);

    // Save to Firestore
    try {
        const docId = await savePerson(person);
        person.id = docId; // Store the Firestore document ID
        console.log('Person added successfully:', person.handle);
    } catch (error) {
        console.error('Failed to save person:', error);
        alert('Failed to save person to database. Please try again.');
        // Remove from local array if save failed
        people.pop();
        return;
    }

    // Redraw chart
    const canvas = document.getElementById('burnChart');
    const ctx = canvas.getContext('2d');
    drawChart(ctx, canvas.width, canvas.height);

    // Update person list
    updatePersonList();

    // Clear inputs
    handleInput.value = '';
    profilePicInput.value = '';
    foodInput.value = '';
    characterInput.value = '';
}

// Update person list display
function updatePersonList() {
    const personList = document.getElementById('personList');
    personList.innerHTML = '';

    people.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';

        const pfp = document.createElement('img');
        pfp.className = 'person-pfp';
        if (person.imageDataUrl) {
            pfp.src = person.imageDataUrl;
        } else if (person.image) {
            pfp.src = person.image.src;
        } else {
            pfp.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.handle.replace('@', ''))}&size=100&background=${colors.accent1.replace('#', '')}&color=fff`;
        }

        const info = document.createElement('div');
        info.className = 'person-info';

        const handleDiv = document.createElement('div');
        handleDiv.className = 'person-handle';
        handleDiv.textContent = person.handle;

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'person-score';
        const scoreClass = person.socialScore >= 0 ? 'score-positive' : 'score-negative';
        scoreDiv.innerHTML = `Social Score: <span class="${scoreClass}">${person.socialScore}</span>`;

        info.appendChild(handleDiv);
        info.appendChild(scoreDiv);

        card.appendChild(pfp);
        card.appendChild(info);

        personList.appendChild(card);
    });
}

// Event listeners
document.getElementById('addPerson').addEventListener('click', addPerson);

// Allow Enter key to add person
document.getElementById('twitterHandle').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPerson();
});

document.getElementById('foodScore').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPerson();
});

document.getElementById('character').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPerson();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('burnChart');
    const container = canvas.parentElement;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        canvas.width = container.clientWidth - 10;
    } else {
        canvas.width = container.clientWidth - 40; // Subtract padding
    }

    const ctx = canvas.getContext('2d');
    drawChart(ctx, canvas.width, canvas.height);
});

// Initialize on load
window.addEventListener('load', async () => {
    console.log('Page loaded, initializing chart...');
    try {
        initChart();
        console.log('Chart initialized successfully');
        await loadPeople();
        console.log('People loaded successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
