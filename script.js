/* ===========================================
   WATER REMINDER APP - JAVASCRIPT
   =========================================== */

// Global variables to track app state
let glassesConsumed = 0;
const dailyGoal = 8;
let reminderInterval = null;
let reminderActive = false;

// Motivational messages for different progress levels
const motivationalMessages = {
    0: "🌟 Start your hydration journey!",
    1: "💪 Great start! Keep it up!",
    2: "🎯 You're building momentum!",
    3: "🔥 Halfway there! You're doing amazing!",
    4: "⚡ More than halfway! Keep pushing!",
    5: "🚀 You're on fire! Almost there!",
    6: "🏆 So close to your goal! One more push!",
    7: "🎉 Final stretch! You've got this!",
    8: "🌈 Goal achieved! You're a hydration champion!"
};

// Audio elements for various sounds
let addGlassSound;
let reminderSound;
let goalCompletedSound;

/**
 * Initialize the app when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    loadSavedProgress();
    updateDisplay();
    initializeSounds();
    
    // Register service worker for better mobile notifications
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                // Only request notification permission after service worker is ready
                registration.ready.then(() => requestNotificationPermission());
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
                // Fall back to regular notification permission
                requestNotificationPermission();
            });
    } else {
        // Browser doesn't support Service Workers
        requestNotificationPermission();
    }
});

/**
 * Initialize sound elements
 */
function initializeSounds() {
    // Create audio elements
    addGlassSound = new Audio('https://soundbible.com/mp3/Water%20Splash-SoundBible.com-800223477.mp3'); // New water splash sound
    reminderSound = new Audio('https://soundbible.com/grab.php?id=2156&type=mp3'); // Bell notification
    goalCompletedSound = new Audio('https://soundbible.com/grab.php?id=1823&type=mp3'); // Success sound
    
    // Set volume levels
    addGlassSound.volume = 0.5;
    reminderSound.volume = 0.7;
    goalCompletedSound.volume = 0.6;
}

/**
 * Add a glass of water and update the progress
 */
function addGlass() {
    if (glassesConsumed < dailyGoal) {
        glassesConsumed++;
        updateDisplay();
        saveProgress();
        showMotivationalMessage();
        animateAddGlass();
        
        // Play sound when adding a glass
        playSound(addGlassSound);
        
        // Special celebration when goal is reached
        if (glassesConsumed === dailyGoal) {
            celebrateGoalAchievement();
        }
    }
}

/**
 * Update all visual elements to reflect current progress
 */
function updateDisplay() {
    const glassesCountEl = document.getElementById('glassesCount');
    const progressBarEl = document.getElementById('progressBar');
    const progressPercentageEl = document.getElementById('progressPercentage');
    
    // Update glasses count with animation
    glassesCountEl.textContent = glassesConsumed;
    
    // Calculate and update progress percentage
    const percentage = Math.min((glassesConsumed / dailyGoal) * 100, 100);
    progressBarEl.style.width = percentage + '%';
    progressPercentageEl.textContent = Math.round(percentage) + '% Complete';
    
    // Change progress bar color when goal is achieved
    if (glassesConsumed >= dailyGoal) {
        progressBarEl.classList.add('complete');
    } else {
        progressBarEl.classList.remove('complete');
    }
    
    // Update button state
    const addBtn = document.getElementById('addGlassBtn');
    if (glassesConsumed >= dailyGoal) {
        addBtn.textContent = '✅ Goal Achieved!';
        addBtn.style.background = 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)';
    } else {
        addBtn.textContent = '+1 Glass 🥤';
        addBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

/**
 * Show motivational message based on current progress
 */
function showMotivationalMessage() {
    const messageEl = document.getElementById('motivationMessage');
    const message = motivationalMessages[glassesConsumed] || "Keep going! 💪";
    
    messageEl.textContent = message;
    messageEl.classList.remove('show');
    
    // Trigger animation after a brief delay
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    // Hide message after 3 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

/**
 * Animate the add glass button when clicked
 */
function animateAddGlass() {
    const btn = document.getElementById('addGlassBtn');
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
}

/**
 * Special celebration when daily goal is achieved
 */
function celebrateGoalAchievement() {
    // Create confetti effect (simplified version using existing elements)
    const container = document.querySelector('.app-container');
    container.style.animation = 'none';
    
    setTimeout(() => {
        container.style.animation = 'pulse 0.6s ease-in-out 3';
    }, 100);
    
    // Play celebration sound
    playSound(goalCompletedSound);
    
    // Show achievement notification
    showNotification('🎉 Congratulations!', 'You\'ve reached your daily hydration goal!');
}

/**
 * Toggle reminder system on/off
 */
function toggleReminder() {
    const intervalInput = document.getElementById('reminderInterval');
    const reminderBtn = document.getElementById('reminderBtn');
    const statusEl = document.getElementById('reminderStatus');
    
    if (!reminderActive) {
        // Start reminders
        const minutes = parseInt(intervalInput.value);
        
        if (isNaN(minutes) || minutes < 1 || minutes > 240) {
            alert('Please enter a valid interval between 1 and 240 minutes.');
            return;
        }
        
        reminderActive = true;
        const milliseconds = minutes * 60 * 1000;
        
        reminderInterval = setInterval(() => {
            if (glassesConsumed < dailyGoal) {
                showWaterReminder();
            }
        }, milliseconds);
        
        // Update UI
        reminderBtn.textContent = 'Stop';
        reminderBtn.classList.add('stop');
        statusEl.textContent = `⏰ Reminding every ${minutes} minute(s)`;
        statusEl.classList.add('active');
        intervalInput.disabled = true;
        
        showNotification('⏰ Reminders Active', `You'll be reminded every ${minutes} minute(s)`);
        
    } else {
        // Stop reminders
        stopReminder();
    }
}

/**
 * Stop the reminder system
 */
function stopReminder() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
    
    reminderActive = false;
    
    // Update UI
    const reminderBtn = document.getElementById('reminderBtn');
    const statusEl = document.getElementById('reminderStatus');
    const intervalInput = document.getElementById('reminderInterval');
    
    reminderBtn.textContent = 'Start';
    reminderBtn.classList.remove('stop');
    statusEl.textContent = 'Set a custom reminder interval';
    statusEl.classList.remove('active');
    intervalInput.disabled = false;
}

/**
 * Request notification permission more proactively for mobile
 */
function requestNotificationPermission() {
    if ('Notification' in window) {
        // Mobile-specific detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Add a clear user interaction for mobile browsers
        const requestPermissionOnUserInteraction = () => {
            // Remove the event listener to prevent multiple requests
            document.removeEventListener('click', requestPermissionOnUserInteraction);
            
            // Request permission with a timeout to ensure UI has time to respond
            setTimeout(() => {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showNotification('✅ Notifications Enabled', 'You will now receive reminders even when the app is not open.');
                        
                        // For mobile, send a test notification to confirm permissions
                        if (isMobile && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({
                                type: 'ENABLE_NOTIFICATIONS'
                            });
                        }
                    } else {
                        showNotification('❌ Notifications Disabled', 'You will only receive reminders when the app is open.');
                    }
                }).catch(error => {
                    console.error('Error requesting notification permission:', error);
                    
                    // On mobile, show instructions for enabling notifications manually
                    if (isMobile) {
                        showMobileNotificationInstructions();
                    } else {
                        showNotification('❌ Notification Error', 'Please check your browser settings to enable notifications manually.');
                    }
                });
            }, 1000);
        };
        
        // Check if permission isn't granted yet
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            // Show different messages for mobile vs desktop
            if (isMobile) {
                showNotification(
                    '🔔 Enable Notifications', 
                    'Tap the button below to enable reminder notifications'
                );
            } else {
                showNotification(
                    '🔔 Enable Notifications', 
                    'Click anywhere to enable reminder notifications'
                );
            }
            
            // Listen for user interaction (required for mobile browsers)
            document.addEventListener('click', requestPermissionOnUserInteraction);
            
            // For mobile, always add a prominent permission button
            if (isMobile) {
                addMobilePermissionButton();
            } else {
                addPermissionButton();
            }
        }
    }
}

/**
 * Add a more prominent permission button specifically for mobile
 */
function addMobilePermissionButton() {
    // Create a button that's clearly visible for mobile users
    const permButton = document.createElement('button');
    permButton.innerText = '🔔 Tap to Enable Notifications';
    permButton.className = 'permission-btn mobile';
    permButton.onclick = function(e) {
        e.stopPropagation(); // Prevent other click handlers
        
        // Request permission on button click
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('✅ Notifications Enabled', 'You will now receive reminders even when the app is not open.');
                
                // Send a test notification via service worker
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'ENABLE_NOTIFICATIONS'
                    });
                }
            } else {
                showNotification('❌ Notifications Disabled', 'You will only receive reminders when the app is open.');
                showMobileNotificationInstructions();
            }
            // Remove the button after permission is decided
            this.remove();
        }).catch(error => {
            console.error('Error requesting permission:', error);
            showMobileNotificationInstructions();
            this.remove();
        });
    };
    
    // Add the button to the page in a very visible position
    document.body.appendChild(permButton);
    
    // Keep the button visible longer on mobile
    setTimeout(() => {
        if (document.body.contains(permButton)) {
            permButton.remove();
        }
    }, 30000); // 30 seconds for mobile
}

/**
 * Show instructions for enabling notifications on mobile devices
 */
function showMobileNotificationInstructions() {
    // Create a modal with instructions
    const modal = document.createElement('div');
    modal.className = 'notification-instructions';
    
    // Detect device type for specific instructions
    let instructions = '';
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        instructions = `
            <h3>Enable Notifications on iOS:</h3>
            <ol>
                <li>Open Settings</li>
                <li>Scroll down and tap Safari</li>
                <li>Tap "Notifications"</li>
                <li>Toggle "Allow Notifications" on</li>
                <li>Return to this app and refresh</li>
            </ol>
        `;
    } else if (/Android/i.test(navigator.userAgent)) {
        instructions = `
            <h3>Enable Notifications on Android:</h3>
            <ol>
                <li>Open Settings</li>
                <li>Tap "Apps" or "Applications"</li>
                <li>Find your browser (Chrome, etc.)</li>
                <li>Tap "Notifications"</li>
                <li>Enable notifications</li>
                <li>Return to this app and refresh</li>
            </ol>
        `;
    } else {
        instructions = `
            <h3>Enable Notifications:</h3>
            <p>Please check your browser settings to enable notifications manually.</p>
        `;
    }
    
    modal.innerHTML = `
        <div class="instructions-content">
            <h2>📱 Notification Setup</h2>
            ${instructions}
            <button class="close-instructions">Got it</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    modal.querySelector('.close-instructions').addEventListener('click', () => {
        modal.remove();
    });
}

/**
 * Show water drinking reminder with improved system notification
 */
function showWaterReminder() {
    const remaining = dailyGoal - glassesConsumed;
    const message = remaining > 1 
        ? `Time to drink water! ${remaining} glasses remaining.`
        : `Almost there! Just ${remaining} more glass to go!`;
    
    // In-app notification
    showNotification('💧 Hydration Reminder', message);
    
    // Play reminder sound
    playSound(reminderSound);
    
    // System notification with more options
    if ('Notification' in window && Notification.permission === 'granted') {
        const options = {
            body: message,
            icon: createWaterDropIcon(),
            badge: createWaterDropIcon(),
            vibrate: [200, 100, 200], // Vibration pattern for mobile devices
            tag: 'water-reminder', // Prevents multiple notifications from stacking
            renotify: true, // Makes device alert again for notifications with the same tag
            requireInteraction: true // Makes notification stay until user interacts with it
        };
        
        new Notification('💧 Hydration Reminder', options);
    }
}

/**
 * Show custom in-app notification
 */
function showNotification(title, message) {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div>${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

/**
 * Reset daily progress
 */
function resetProgress() {
    if (confirm('Are you sure you want to reset your daily progress?')) {
        glassesConsumed = 0;
        updateDisplay();
        saveProgress();
        stopReminder();
        
        showNotification('🔄 Progress Reset', 'Start fresh with your hydration journey!');
        
        // Hide any visible motivational message
        const messageEl = document.getElementById('motivationMessage');
        messageEl.classList.remove('show');
    }
}

/**
 * Save progress to localStorage
 */
function saveProgress() {
    const today = new Date().toDateString();
    const data = {
        date: today,
        glasses: glassesConsumed
    };
    localStorage.setItem('waterTrackerProgress', JSON.stringify(data));
}

/**
 * Load saved progress from localStorage
 */
function loadSavedProgress() {
    try {
        const saved = localStorage.getItem('waterTrackerProgress');
        if (saved) {
            const data = JSON.parse(saved);
            const today = new Date().toDateString();
            
            // Only load if it's from today
            if (data.date === today) {
                glassesConsumed = data.glasses || 0;
            } else {
                // New day, reset progress
                glassesConsumed = 0;
            }
        }
    } catch (error) {
        console.error('Error loading saved progress:', error);
        glassesConsumed = 0;
    }
}

/**
 * Utility function to format time
 */
function formatTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Debug function to check app state
 */
function debugAppState() {
    console.log('=== Water Tracker Debug Info ===');
    console.log('Glasses consumed:', glassesConsumed);
    console.log('Daily goal:', dailyGoal);
    console.log('Reminder active:', reminderActive);
    console.log('Progress percentage:', Math.round((glassesConsumed / dailyGoal) + '%'));
    console.log('================================');
}

// Sound settings
let soundEnabled = true;

/**
 * Toggle sounds on/off
 */
function toggleSound() {
    const soundToggle = document.getElementById('soundToggle');
    soundEnabled = soundToggle.checked;
    
    // Show feedback
    showNotification(
        soundEnabled ? '🔊 Sounds Enabled' : '🔇 Sounds Disabled',
        soundEnabled ? 'You will now hear notification sounds.' : 'Sound notifications are now muted.'
    );
}

/**
 * Update volume based on slider
 */
function updateVolume() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volume = volumeSlider.value / 100; // Convert to 0-1 range
    setVolume(volume);
}

/**
 * Play a sound with error handling
 */
function playSound(sound) {
    // Only play if sounds are enabled
    if (!soundEnabled) return;
    
    // Check if sound exists and browser supports audio
    if (sound && typeof sound.play === 'function') {
        // Reset the sound to the beginning (in case it was already playing)
        sound.currentTime = 0;
        
        // Play the sound with error handling
        sound.play().catch(error => {
            console.log('Error playing sound:', error);
            // Most likely due to user not interacting with page yet
        });
    }
}

/**
 * Create a water drop icon for browser notifications
 */
function createWaterDropIcon() {
    // Return a data URL for a simple water drop icon
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzRmYWNmZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkocnPC90ZXh0Pjwvc3ZnPg==';
}

// Add a volume control function
function setVolume(level) {
    // Ensure level is between 0 and 1
    const volume = Math.min(Math.max(level, 0), 1);
    
    // Apply to all sounds
    if (addGlassSound) addGlassSound.volume = volume;
    if (reminderSound) reminderSound.volume = volume;
    if (goalCompletedSound) goalCompletedSound.volume = volume;
}