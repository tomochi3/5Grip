document.addEventListener('DOMContentLoaded', () => {
    const wallContainer = document.getElementById('wall-container');
    const altitudeDisplay = document.getElementById('current-altitude');
    const climber = document.getElementById('climber');
    const checkpoints = document.querySelectorAll('.checkpoint');

    // Generate random holds
    const colors = ['#e94560', '#0f3460', '#533483', '#16213e'];
    const holdCount = 100;

    for (let i = 0; i < holdCount; i++) {
        const hold = document.createElement('div');
        hold.classList.add('hold');

        // Random position
        const top = Math.random() * 100; // percent
        const left = Math.random() * 90 + 5; // keep away from absolute edges
        const size = Math.random() * 40 + 20; // 20px to 60px
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotation = Math.random() * 360;

        hold.style.top = top + '%';
        hold.style.left = left + '%';
        hold.style.width = size + 'px';
        hold.style.height = size + 'px';
        hold.style.backgroundColor = color;
        hold.style.transform = `rotate(${rotation}deg)`;

        wallContainer.appendChild(hold);
    }

    // Set Checkpoint positions (absolute vertical positioning based on data-altitude)
    // Map 0-100m to the container height
    // We want 0m at the TOP of the scroll (start) and 100m at the BOTTOM?
    // Wait, climbing implies going UP.
    // Let's invert it: Scroll DOWN means climbing UP (moving visually through the wall).
    // Or, we start at bottom and scroll up?
    // Standard web is scroll down. Let's make Scroll Down = Climb Up the mountain visually
    // Implementation: As we scroll down, the altitude meter goes UP.

    const maxScroll = wallContainer.offsetHeight - window.innerHeight;

    // Position checkpoints relative to the wall height
    checkpoints.forEach(cp => {
        const alt = parseInt(cp.dataset.altitude);
        // Map altitude: 0m = Top of page (start), 100m = Bottom of page (end)
        // Wait, normally climbing starts at bottom. But web starts at top.
        // Let's create a narrative: We are "descending" into the depth? No, The Ascent.
        // Let's make the background move so it feels like we are moving up when we scroll down.

        // Simply: content is placed along the height.
        // 0m check point is at the top (0% of container)
        // 100m check point is at the bottom (100% of container)
        const percent = alt / 100;
        const topPos = percent * (wallContainer.offsetHeight - window.innerHeight); // adjust for viewport

        cp.style.top = topPos + 'px';
    });


    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const progress = Math.min(scrollY / maxScroll, 1);

        // Update Altitude Number
        const altitude = Math.floor(progress * 100);
        altitudeDisplay.textContent = altitude;

        // Move Climber slightly side-to-side based on scroll to simulate movement
        const wobble = Math.sin(scrollY * 0.05) * 20; // 20px wobble
        climber.style.transform = `translateX(calc(-50% + ${wobble}px))`;

        // Check active checkpoints
        checkpoints.forEach(cp => {
            const rect = cp.getBoundingClientRect();
            // If element is roughly in center of screen
            if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4) {
                cp.classList.add('active');
            } else {
                cp.classList.remove('active');
            }
        });

        // "Summit" effects at end
        if (progress >= 0.99) {
            altitudeDisplay.style.color = 'gold';
        } else {
            altitudeDisplay.style.color = '#e94560';
        }
    });

    // Trigger initial check
    window.dispatchEvent(new Event('scroll'));
});
