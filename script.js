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

    // Grid lines removed - only axis lines will be drawn below

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

    // Draw labels at the end of each pink axis line
    ctx.fillStyle = colors.primary; // Use pink color to match the axis
    const labelFontSize = isMobile ? 9 : 11;
    ctx.font = `bold ${labelFontSize}px Georgia`;

    // X-axis labels - stacked vertically letter by letter
    const letterSpacing = isMobile ? 10 : 12;
    const xLabelOffset = isMobile ? 15 : 20;

    // Left end of X-axis: "Dietary Restrictions" (stacked vertically)
    ctx.textAlign = 'center';
    const leftLabel = 'Dietary Restrictions';
    const leftStartY = padding + chartHeight / 2 - (leftLabel.length * letterSpacing) / 2;
    for (let i = 0; i < leftLabel.length; i++) {
        ctx.fillText(leftLabel[i], padding - xLabelOffset, leftStartY + i * letterSpacing);
    }

    // Right end of X-axis: "Epicurean" (stacked vertically)
    const rightLabel = 'Epicurean';
    const rightStartY = padding + chartHeight / 2 - (rightLabel.length * letterSpacing) / 2;
    for (let i = 0; i < rightLabel.length; i++) {
        ctx.fillText(rightLabel[i], padding + chartWidth + xLabelOffset, rightStartY + i * letterSpacing);
    }

    // Y-axis labels - horizontal landscape, positioned at the ends of the vertical pink line
    const yLabelOffset = isMobile ? 8 : 10;

    // Top end of Y-axis: "Pristine" (horizontal)
    ctx.textAlign = 'center';
    ctx.fillText('Pristine', padding + chartWidth / 2, padding - yLabelOffset);

    // Bottom end of Y-axis: "Cunt" (horizontal)
    ctx.textAlign = 'center';
    ctx.fillText('Cunt', padding + chartWidth / 2, padding + chartHeight + yLabelOffset + labelFontSize);

    // Draw axis numbers with smaller font
    const numberFontSize = isMobile ? 8 : 10;
    ctx.font = `${numberFontSize}px Georgia`;
    ctx.fillStyle = colors.tertiary;

    // X-axis numbers
    const xNumberY = isMobile ? height - 5 : height - 10;
    ctx.fillText('0', padding, xNumberY);
    ctx.fillText('50', padding + chartWidth / 2, xNumberY);
    ctx.fillText('100', padding + chartWidth, xNumberY);

    // Y-axis numbers
    ctx.textAlign = 'right';
    const yNumberOffset = isMobile ? 5 : 8;
    ctx.fillText('100', padding - yNumberOffset, padding + 5);
    ctx.fillText('50', padding - yNumberOffset, padding + chartHeight / 2 + 5);
    ctx.fillText('0', padding - yNumberOffset, padding + chartHeight + 5);

    // Draw people on chart with collision detection
    console.log('Drawing', people.length, 'people on chart');

    // Track occupied positions to detect overlaps
    const positions = [];
    const minDistance = isMobile ? 25 : 30; // Minimum distance between avatars (using isMobile from above)

    people.forEach((person, index) => {
        console.log(`Drawing person ${index}:`, person.handle, 'foodScore:', person.foodScore, 'character:', person.character);

        // Calculate base position (0-100 scale)
        let baseX = padding + (person.foodScore / 100) * chartWidth;
        let baseY = padding + ((100 - person.character) / 100) * chartHeight;

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
    // Convert coordinates (0 to 100) to canvas coordinates
    let x = padding + (person.foodScore / 100) * chartWidth;
    let y = padding + ((100 - person.character) / 100) * chartHeight; // Inverted Y

    // Apply offset to prevent overlapping
    x += offsetX;
    y += offsetY;

    console.log(`Positioning ${person.handle} at x:${x}, y:${y}`);

    // Smaller avatar size for less clutter
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 20 : 25;
    const radius = size / 2;

    // Check if user is logged in or in view-only mode
    const isLoggedIn = sessionStorage.getItem('authenticated');
    const isViewOnly = sessionStorage.getItem('viewOnly');

    // Draw profile picture if available AND (logged in OR view-only)
    if (person.image && (isLoggedIn || isViewOnly)) {
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
        // Draw pink circle placeholder (no pfp when not logged in)
        ctx.fillStyle = colors.primary; // Hot pink
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Only show colored border if logged in or view-only
        if (isLoggedIn || isViewOnly) {
            ctx.strokeStyle = getScoreColor(person.socialScore);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
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

    return Math.round(score); // Already on 0-100 scale
}

// Get color based on score
function getScoreColor(score) {
    if (score > 75) return colors.primary;
    if (score > 50) return colors.secondary;
    if (score > 25) return colors.tertiary;
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
    const userProfile = document.getElementById('userProfile');
    const viewOnceButton = document.getElementById('viewOnceButton');
    const isAuthenticated = sessionStorage.getItem('authenticated');
    const isViewOnly = sessionStorage.getItem('viewOnly');

    if (isAuthenticated) {
        overlay.classList.add('hidden');

        // Hide View Once button when fully authenticated
        if (viewOnceButton) {
            viewOnceButton.classList.add('hidden');
        }

        // Show user profile
        if (userProfile) {
            const userName = sessionStorage.getItem('username');
            const userEmoji = sessionStorage.getItem('userEmoji');

            if (userName && userEmoji) {
                document.getElementById('userName').textContent = userName;

                const emojiElement = document.getElementById('userEmoji');
                // Check if userEmoji is a data URL (image) or emoji
                if (userEmoji.startsWith('data:')) {
                    // It's an image
                    emojiElement.innerHTML = `<img src="${userEmoji}" style="width: 1.5em; height: 1.5em; border-radius: 50%; object-fit: cover;">`;
                } else {
                    // It's an emoji
                    emojiElement.textContent = userEmoji;
                }

                userProfile.style.display = 'flex';
            }
        }
    } else {
        overlay.classList.remove('hidden');
        if (userProfile) {
            userProfile.style.display = 'none';
        }

        // Show View Once button when not authenticated
        if (viewOnceButton && !isViewOnly) {
            viewOnceButton.classList.remove('hidden');
        }
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.clear();
    checkAuth();

    // Redraw chart to hide pfps
    const canvas = document.getElementById('burnChart');
    const ctx = canvas.getContext('2d');
    drawChart(ctx, canvas.width, canvas.height);

    // Update person list to hide scores
    updatePersonList();
}

// View-only mode variables
const VIEW_ONLY_PASSWORD = 'viewonly123';
let viewOnlyTimeout = null;

// Handle view-only access
function handleViewOnce() {
    const password = prompt('Enter view-only password:');

    if (password === VIEW_ONLY_PASSWORD) {
        // Set view-only session
        sessionStorage.setItem('viewOnly', 'true');
        sessionStorage.setItem('viewOnlyTime', Date.now().toString());

        // Hide the View Once button
        const viewOnceButton = document.getElementById('viewOnceButton');
        if (viewOnceButton) {
            viewOnceButton.classList.add('hidden');
        }

        // Redraw chart to show pfps
        const canvas = document.getElementById('burnChart');
        const ctx = canvas.getContext('2d');
        drawChart(ctx, canvas.width, canvas.height);

        // Update person list to show scores
        updatePersonList();

        // Set 15-second timeout
        viewOnlyTimeout = setTimeout(() => {
            handleViewOnlyExpire();
        }, 15000);

        alert('✅ View-only access granted for 15 seconds!');
    } else {
        alert('❌ Incorrect password!');
    }
}

// Handle view-only expiration
function handleViewOnlyExpire() {
    sessionStorage.removeItem('viewOnly');
    sessionStorage.removeItem('viewOnlyTime');

    // Show the View Once button again
    const viewOnceButton = document.getElementById('viewOnceButton');
    if (viewOnceButton) {
        viewOnceButton.classList.remove('hidden');
    }

    // Redraw chart to hide pfps
    const canvas = document.getElementById('burnChart');
    const ctx = canvas.getContext('2d');
    drawChart(ctx, canvas.width, canvas.height);

    // Update person list to hide scores
    updatePersonList();

    alert('⏰ View-only session expired. Click "View Once" to view again.');
}

// Handle login button click
document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const viewOnceButton = document.getElementById('viewOnceButton');
    if (viewOnceButton) {
        viewOnceButton.addEventListener('click', handleViewOnce);
    }

    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', openEditProfileModal);
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

    if (isNaN(foodScore) || foodScore < 0 || foodScore > 100) {
        alert('Food score must be between 0 and 100!');
        return;
    }

    if (isNaN(character) || character < 0 || character > 100) {
        alert('Character must be between 0 and 100!');
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

    // Check if user is logged in or in view-only mode
    const isLoggedIn = sessionStorage.getItem('authenticated');
    const isViewOnly = sessionStorage.getItem('viewOnly');

    people.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';

        // Make cards clickable for admins only (not view-only)
        if (isLoggedIn) {
            card.classList.add('clickable');
            card.onclick = () => openEditScoreModal(index);
        }

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

        // Only show score if logged in or view-only
        if (isLoggedIn || isViewOnly) {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'person-score';
            const scoreClass = person.socialScore >= 0 ? 'score-positive' : 'score-negative';
            scoreDiv.innerHTML = `Score: <span class="${scoreClass}">${person.socialScore}</span>`;
            info.appendChild(scoreDiv);
        }

        info.appendChild(handleDiv);

        card.appendChild(pfp);
        card.appendChild(info);

        personList.appendChild(card);
    });
}

// Edit score modal functions
let currentEditingIndex = null;

function openEditScoreModal(index) {
    const isLoggedIn = sessionStorage.getItem('authenticated');
    if (!isLoggedIn) return;

    currentEditingIndex = index;
    const person = people[index];

    document.getElementById('editHandle').value = person.handle;
    document.getElementById('editFoodScore').value = person.foodScore;
    document.getElementById('editCharacterScore').value = person.character;

    document.getElementById('editScoreModal').style.display = 'block';
}

function closeEditScoreModal() {
    document.getElementById('editScoreModal').style.display = 'none';
    currentEditingIndex = null;
}

async function saveEditedEntry() {
    if (currentEditingIndex === null) return;

    const person = people[currentEditingIndex];
    const newFoodScore = parseInt(document.getElementById('editFoodScore').value);
    const newCharacterScore = parseInt(document.getElementById('editCharacterScore').value);

    // Validation
    if (isNaN(newFoodScore) || newFoodScore < 0 || newFoodScore > 100) {
        alert('Food score must be between 0 and 100!');
        return;
    }

    if (isNaN(newCharacterScore) || newCharacterScore < 0 || newCharacterScore > 100) {
        alert('Character score must be between 0 and 100!');
        return;
    }

    // Update person
    person.foodScore = newFoodScore;
    person.character = newCharacterScore;
    person.socialScore = calculateSocialScore(newFoodScore, newCharacterScore);

    // Update in Firestore
    try {
        await window.db.collection('people').doc(person.id).update({
            foodScore: person.foodScore,
            character: person.character,
            socialScore: person.socialScore
        });

        // Redraw chart
        const canvas = document.getElementById('burnChart');
        const ctx = canvas.getContext('2d');
        drawChart(ctx, canvas.width, canvas.height);

        // Update person list
        updatePersonList();

        closeEditScoreModal();
        console.log('Entry updated successfully');
    } catch (error) {
        console.error('Error updating entry:', error);
        alert('Failed to update entry. Please try again.');
    }
}

async function deleteEntry() {
    if (currentEditingIndex === null) return;

    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }

    const person = people[currentEditingIndex];

    // Delete from Firestore
    try {
        await window.db.collection('people').doc(person.id).delete();

        // Remove from local array
        people.splice(currentEditingIndex, 1);

        // Redraw chart
        const canvas = document.getElementById('burnChart');
        const ctx = canvas.getContext('2d');
        drawChart(ctx, canvas.width, canvas.height);

        // Update person list
        updatePersonList();

        closeEditScoreModal();
        console.log('Entry deleted successfully');
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const editScoreModal = document.getElementById('editScoreModal');
    const editProfileModal = document.getElementById('editProfileModal');

    if (event.target === editScoreModal) {
        closeEditScoreModal();
    }
    if (event.target === editProfileModal) {
        closeEditProfileModal();
    }
});

// Edit Profile Modal Functions
function openEditProfileModal() {
    const userId = sessionStorage.getItem('userId');
    console.log('Opening edit profile modal, userId:', userId);

    if (!userId) {
        console.error('No userId found in sessionStorage');
        alert('Error: No user ID found. Please log in again.');
        return;
    }

    // Load board members from localStorage
    const boardMembers = JSON.parse(localStorage.getItem('boardMembers') || '[]');
    console.log('Board members from localStorage:', boardMembers);

    const member = boardMembers.find(m => m.id === userId);
    console.log('Found member:', member);

    if (!member) {
        console.error('Member not found for userId:', userId);
        alert('Error: Profile data not found. Please log in again.');
        return;
    }

    // Populate form
    document.getElementById('editProfileName').value = member.name;
    document.getElementById('editProfileRole').value = member.role;
    document.getElementById('editProfileEmoji').value = member.emoji;
    document.getElementById('editProfilePassword').value = member.password;

    // Show preview
    const previewEmoji = document.getElementById('profilePreviewEmoji');
    const previewImage = document.getElementById('profilePreviewImage');

    if (member.imageUrl) {
        previewImage.src = member.imageUrl;
        previewImage.style.display = 'block';
        previewEmoji.style.display = 'none';
    } else {
        previewEmoji.textContent = member.emoji;
        previewEmoji.style.display = 'block';
        previewImage.style.display = 'none';
    }

    document.getElementById('editProfileModal').style.display = 'block';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function saveEditedProfile() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const newName = document.getElementById('editProfileName').value;
    const newRole = document.getElementById('editProfileRole').value;
    const newEmoji = document.getElementById('editProfileEmoji').value || '🐭';
    const newPassword = document.getElementById('editProfilePassword').value;

    if (!newName || !newRole || !newPassword) {
        alert('Please fill in all required fields!');
        return;
    }

    // Load board members
    const boardMembers = JSON.parse(localStorage.getItem('boardMembers') || '[]');
    const memberIndex = boardMembers.findIndex(m => m.id === userId);

    if (memberIndex === -1) return;

    // Update member data
    boardMembers[memberIndex].name = newName;
    boardMembers[memberIndex].role = newRole;
    boardMembers[memberIndex].emoji = newEmoji;
    boardMembers[memberIndex].password = newPassword;

    // Handle profile picture upload
    const fileInput = document.getElementById('editProfilePic');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            boardMembers[memberIndex].imageUrl = e.target.result;

            // Save to localStorage
            localStorage.setItem('boardMembers', JSON.stringify(boardMembers));

            // Update session storage
            sessionStorage.setItem('username', newName);
            sessionStorage.setItem('userRole', newRole);
            sessionStorage.setItem('userEmoji', e.target.result);

            // Update UI
            updateUserProfileDisplay();
            closeEditProfileModal();
            alert('✅ Profile updated successfully!');
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        // Save without new image
        localStorage.setItem('boardMembers', JSON.stringify(boardMembers));

        // Update session storage
        sessionStorage.setItem('username', newName);
        sessionStorage.setItem('userRole', newRole);
        sessionStorage.setItem('userEmoji', boardMembers[memberIndex].imageUrl || newEmoji);

        // Update UI
        updateUserProfileDisplay();
        closeEditProfileModal();
        alert('✅ Profile updated successfully!');
    }
}

function updateUserProfileDisplay() {
    const userName = sessionStorage.getItem('username');
    const userEmoji = sessionStorage.getItem('userEmoji');

    if (userName && userEmoji) {
        document.getElementById('userName').textContent = userName;

        const emojiElement = document.getElementById('userEmoji');
        if (userEmoji.startsWith('data:')) {
            emojiElement.innerHTML = `<img src="${userEmoji}" style="width: 1.5em; height: 1.5em; border-radius: 50%; object-fit: cover;">`;
        } else {
            emojiElement.textContent = userEmoji;
        }
    }
}

// Profile picture preview in edit modal
document.addEventListener('DOMContentLoaded', function() {
    const profilePicInput = document.getElementById('editProfilePic');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const previewImage = document.getElementById('profilePreviewImage');
                    const previewEmoji = document.getElementById('profilePreviewEmoji');
                    previewImage.src = event.target.result;
                    previewImage.style.display = 'block';
                    previewEmoji.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

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

// Screenshot and screen recording protection
function initScreenProtection() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Disable keyboard shortcuts for screenshots
    document.addEventListener('keydown', (e) => {
        // Prevent Command+Shift+3/4/5 (Mac screenshots)
        // Prevent Print Screen (Windows)
        // Prevent Command+Shift+S (some screenshot tools)
        if (
            (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
            e.key === 'PrintScreen' ||
            (e.metaKey && e.shiftKey && e.key === 's') ||
            (e.ctrlKey && e.key === 'p')
        ) {
            e.preventDefault();
            alert('🚫 Screenshots are disabled');
            return false;
        }
    });

    // Detect when user leaves/switches tab (may be using screen recording)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('⚠️ User left the page - possible screen recording');
        }
    });

    // Add watermark to make screenshots less useful
    const watermark = document.createElement('div');
    watermark.id = 'watermark';
    watermark.style.position = 'fixed';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%)';
    watermark.style.fontSize = '8em';
    watermark.style.opacity = '0.03';
    watermark.style.pointerEvents = 'none';
    watermark.style.userSelect = 'none';
    watermark.style.zIndex = '9999';
    watermark.style.color = '#FF1493';
    watermark.style.fontWeight = 'bold';
    watermark.textContent = 'S.A.C CONFIDENTIAL';
    document.body.appendChild(watermark);

    // Detect devtools (often used with screenshot extensions)
    const detectDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            console.log('⚠️ DevTools may be open');
        }
    };

    setInterval(detectDevTools, 1000);

    // CSS-based protection (add to body)
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Mobile-specific: Disable long-press screenshot
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Blur content when window loses focus (anti screen recording)
    window.addEventListener('blur', () => {
        document.body.style.filter = 'blur(10px)';
    });

    window.addEventListener('focus', () => {
        document.body.style.filter = 'none';
    });
}

// Initialize on load
window.addEventListener('load', async () => {
    console.log('Page loaded, initializing chart...');
    try {
        initChart();
        console.log('Chart initialized successfully');
        await loadPeople();
        console.log('People loaded successfully');

        // Initialize screen protection
        initScreenProtection();
        console.log('Screen protection enabled');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
