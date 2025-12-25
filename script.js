document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#scoring .scoring-grid');
    if (!grid) return;
    const components = Array.from(grid.querySelectorAll('.score-component'));
    const cards = Array.from(grid.querySelectorAll('.scoring-card[id]'));

    const clearActive = () => {
        components.forEach(c => c.classList.remove('is-active'));
        cards.forEach(card => card.classList.remove('is-active'));
    };

    const activate = (targetId, scroll = false) => {
        clearActive();
        components.forEach(c => {
            if (c.dataset.hoverTarget === targetId) c.classList.add('is-active');
        });
        const targetCard = grid.querySelector('#' + CSS.escape(targetId));
        if (targetCard) {
            targetCard.classList.add('is-active');
            if (scroll) targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Add a11y attrs (in case markup changes later)
    components.forEach(c => {
        const targetId = c.dataset.hoverTarget;
        if (!targetId) return;
        c.setAttribute('role', 'button');
        c.setAttribute('tabindex', '0');
        c.setAttribute('aria-controls', targetId);
        c.addEventListener('click', () => activate(targetId, true));
        c.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate(targetId, true);
            }
        });
    });

    // :has() fallback for hover linkage
    const supportsHas = CSS && CSS.supports && CSS.supports('selector(:has(*))');
    if (!supportsHas) {
        components.forEach(c => {
            const targetId = c.dataset.hoverTarget;
            c.addEventListener('mouseenter', () => activate(targetId));
            c.addEventListener('mouseleave', clearActive);
        });
        cards.forEach(card => {
            const targetId = card.id;
            card.addEventListener('mouseenter', () => activate(targetId));
            card.addEventListener('mouseleave', clearActive);
        });
    }
});
