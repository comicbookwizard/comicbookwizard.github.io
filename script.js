// Make terminal windows draggable
document.addEventListener('DOMContentLoaded', function() {
    const terminalWindows = document.querySelectorAll('.terminal-window');
    const mainContainer = document.querySelector('.main-container');
    
    // Track the highest z-index to ensure clicked windows come to front
    let highestZIndex = 10;
    
    // Function to bring a terminal to the front
    function bringToFront(terminal) {
        highestZIndex++;
        terminal.style.zIndex = highestZIndex.toString();
    }
    
    // Add random positioning variance on larger screens
    function applyRandomPositions() {
        if (window.innerWidth >= 1200) {
            terminalWindows.forEach((terminal, index) => {
                // Generate random offsets between -30px and 30px for Y, -20px and 20px for X
                const randomY = Math.floor(Math.random() * 60) - 30; // -30 to 30
                const randomX = Math.floor(Math.random() * 40) - 20; // -20 to 20
                terminal.style.transform = `translateY(${randomY}px) translateX(${randomX}px)`;
            });
        }
    }
    
    // Apply random positions on load
    applyRandomPositions();
    
    // Reapply on window resize (only if crossing the 1200px threshold)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', function() {
        const currentWidth = window.innerWidth;
        // Only reapply if crossing the threshold or if we're above it and positions were reset
        if ((currentWidth >= 1200 && lastWidth < 1200) || 
            (currentWidth >= 1200 && !terminalWindows[0].style.transform)) {
            applyRandomPositions();
        } else if (currentWidth < 1200) {
            // Remove transforms on smaller screens
            terminalWindows.forEach(terminal => {
                terminal.style.transform = '';
            });
        }
        lastWidth = currentWidth;
    });
    
    // Check if device is mobile (viewport width < 768px)
    function isMobile() {
        return window.innerWidth < 768;
    }
    
    terminalWindows.forEach(terminal => {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;
        let hasBeenDragged = false;
        
        // Get the window controls element
        const windowControls = terminal.querySelector('.window-controls');
        
        // Make the entire terminal window draggable from anywhere (only on desktop)
        terminal.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            // Disable dragging on mobile
            if (isMobile()) {
                return;
            }
            
            // Don't start dragging if clicking on:
            // - Control buttons (red, yellow, green circles)
            // - Links (social links)
            // - Any interactive elements
            if (e.target.classList.contains('control-btn') || 
                e.target.closest('a') || 
                e.target.tagName === 'A') {
                return;
            }
            
            e.preventDefault();
            isDragging = true;
            bringToFront(terminal);
            
            // Get current positions BEFORE changing anything
            const terminalRect = terminal.getBoundingClientRect();
            
            // Store the current viewport position
            initialX = terminalRect.left;
            initialY = terminalRect.top;
            
            // Store mouse position
            startX = e.clientX;
            startY = e.clientY;
            
            // If this is the first drag, we need to move it out of the flex container
            if (!hasBeenDragged) {
                // Get computed styles to preserve exact dimensions
                const computedStyle = window.getComputedStyle(terminal);
                const currentWidth = terminalRect.width;
                const currentHeight = terminalRect.height;
                
                // Create a placeholder to maintain the space in the layout
                const placeholder = document.createElement('div');
                placeholder.style.width = `${currentWidth}px`;
                placeholder.style.height = `${currentHeight}px`;
                placeholder.style.visibility = 'hidden';
                placeholder.style.pointerEvents = 'none';
                placeholder.style.flexShrink = '0';
                placeholder.style.margin = '0';
                placeholder.style.gridColumn = 'span 1';
                placeholder.style.gridRow = 'span 1';
                placeholder.className = 'terminal-placeholder';
                
                // Store reference to placeholder on the terminal
                terminal.placeholder = placeholder;
                
                // Replace terminal with placeholder in the layout (maintains grid position)
                terminal.parentNode.insertBefore(placeholder, terminal);
                // Keep terminal in DOM but it's now fixed positioned
                
                // Constrain initial position
                let constrainedX = initialX;
                let constrainedY = initialY;
                
                constrainedY = Math.max(0, constrainedY);
                constrainedX = Math.max(0, constrainedX);
                
                const maxX = window.innerWidth - currentWidth;
                constrainedX = Math.min(maxX, constrainedX);
                
                const maxY = window.innerHeight - 50;
                constrainedY = Math.min(maxY, constrainedY);
                
                // Change to fixed positioning (relative to viewport)
                // Preserve box-sizing and set exact width/height to prevent resizing
                terminal.style.position = 'fixed';
                terminal.style.boxSizing = computedStyle.boxSizing;
                terminal.style.width = `${currentWidth}px`;
                terminal.style.minWidth = `${currentWidth}px`;
                terminal.style.maxWidth = `${currentWidth}px`;
                terminal.style.height = `${currentHeight}px`;
                terminal.style.minHeight = `${currentHeight}px`;
                terminal.style.flexShrink = '0';
                terminal.style.flexGrow = '0';
                terminal.style.left = `${constrainedX}px`;
                terminal.style.top = `${constrainedY}px`;
                terminal.style.margin = '0';
                
                // Update initial position to constrained position
                initialX = constrainedX;
                initialY = constrainedY;
                
                hasBeenDragged = true;
            }
            
            terminal.style.cursor = 'grabbing';
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                // Get terminal dimensions
                const terminalRect = terminal.getBoundingClientRect();
                const terminalWidth = terminalRect.width;
                const terminalHeight = terminalRect.height;
                
                // Calculate new position based on mouse movement
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newX = initialX + deltaX;
                let newY = initialY + deltaY;
                
                // Constrain to viewport bounds
                // Keep top bar visible (y >= 0)
                newY = Math.max(0, newY);
                
                // Keep window from going too far left
                newX = Math.max(0, newX);
                
                // Keep window from going too far right
                const maxX = window.innerWidth - terminalWidth;
                newX = Math.min(maxX, newX);
                
                // Keep window from going too far down (optional, but good UX)
                const maxY = window.innerHeight - 50; // Keep at least 50px visible
                newY = Math.min(maxY, newY);
                
                // Update position
                terminal.style.left = `${newX}px`;
                terminal.style.top = `${newY}px`;
            }
        }
        
        function dragEnd(e) {
            if (isDragging) {
                // Get terminal dimensions
                const terminalRect = terminal.getBoundingClientRect();
                const terminalWidth = terminalRect.width;
                
                // Get current position
                let finalX = terminalRect.left;
                let finalY = terminalRect.top;
                
                // Ensure final position is constrained
                finalY = Math.max(0, finalY);
                finalX = Math.max(0, finalX);
                
                const maxX = window.innerWidth - terminalWidth;
                finalX = Math.min(maxX, finalX);
                
                const maxY = window.innerHeight - 50;
                finalY = Math.min(maxY, finalY);
                
                // Apply constrained position
                terminal.style.left = `${finalX}px`;
                terminal.style.top = `${finalY}px`;
                
                // Update initial position for next drag
                initialX = finalX;
                initialY = finalY;
                
                isDragging = false;
                terminal.style.cursor = 'grab';
                // Keep the z-index as is (don't reset it)
            }
        }
        
        // Initialize cursor for the entire terminal (only on desktop)
        function updateCursor() {
            if (isMobile()) {
                terminal.style.cursor = 'default';
            } else {
                terminal.style.cursor = 'grab';
            }
        }
        
        updateCursor();
        
        // Update cursor on resize
        window.addEventListener('resize', function() {
            updateCursor();
        });
        
        // Change cursor when hovering over interactive elements
        terminal.addEventListener('mouseover', function(e) {
            if (isMobile()) {
                terminal.style.cursor = 'default';
            } else if (e.target.closest('a') || e.target.tagName === 'A') {
                terminal.style.cursor = 'default';
            } else {
                terminal.style.cursor = 'grab';
            }
        });
        
        // Constrain window position on resize
        function constrainWindow() {
            if (hasBeenDragged) {
                const terminalRect = terminal.getBoundingClientRect();
                const terminalWidth = terminalRect.width;
                const terminalHeight = terminalRect.height;
                
                let currentX = terminalRect.left;
                let currentY = terminalRect.top;
                
                // Constrain to viewport bounds
                currentY = Math.max(0, currentY);
                currentX = Math.max(0, currentX);
                
                const maxX = window.innerWidth - terminalWidth;
                currentX = Math.min(maxX, currentX);
                
                const maxY = window.innerHeight - 50;
                currentY = Math.min(maxY, currentY);
                
                terminal.style.left = `${currentX}px`;
                terminal.style.top = `${currentY}px`;
            }
        }
        
        // Listen for window resize events
        window.addEventListener('resize', constrainWindow);
    });
});

