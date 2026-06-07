document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Custom Cursor ---
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    
    let mouseX = 0, mouseY = 0; // Actual mouse position
    let ringX = 0, ringY = 0;   // Ring position (lagging behind)
    
    // Check if device is touch-enabled
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Dot follows cursor immediately
            cursorDot.style.top = `${mouseY}px`;
            cursorDot.style.left = `${mouseX}px`;
            
            // Make cursor visible on movement
            cursorDot.style.opacity = '1';
            cursorRing.style.opacity = '1';
        });
        
        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
        });
        
        // Smooth cursor ring movement (lerp)
        const updateRingPosition = () => {
            const lerpFactor = 0.15; // Smooth lag coefficient
            ringX += (mouseX - ringX) * lerpFactor;
            ringY += (mouseY - ringY) * lerpFactor;
            
            cursorRing.style.top = `${ringY}px`;
            cursorRing.style.left = `${ringX}px`;
            
            requestAnimationFrame(updateRingPosition);
        };
        updateRingPosition();
        
        // Add hover effects for interactive elements
        const hoverTargets = document.querySelectorAll('a, button, .project-card, .skill-badge, .filter-btn, .form-control');
        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            target.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    } else {
        // Hide custom cursor elements on touch devices
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorRing) cursorRing.style.display = 'none';
    }

    // --- 2. Scroll Reveal (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));

    // --- 3. 3D Parallax Tilt for Project Cards ---
    const cards = document.querySelectorAll('.project-card');
    
    if (!isTouchDevice) {
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                // Mouse position relative to card
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Normalise coordinate inputs (-1 to 1)
                const xc = ((x / rect.width) - 0.5) * 2; // -1 to 1
                const yc = ((y / rect.height) - 0.5) * 2; // -1 to 1
                
                // Set rotation angles (tilt max 15 degrees)
                const rotateY = xc * 12;
                const rotateX = -yc * 12;
                
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
                card.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                card.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'rotateX(0) rotateY(0) translateY(0)';
                card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                card.style.boxShadow = 'none';
            });
        });
    }

    // --- 4. Portfolio Filters ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectWrappers = document.querySelectorAll('.project-card-wrapper');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and add to clicked
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            projectWrappers.forEach(wrapper => {
                const category = wrapper.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    wrapper.style.display = 'block';
                    // Retrigger fade-in reveal state
                    setTimeout(() => {
                        wrapper.style.opacity = '1';
                        wrapper.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    wrapper.style.opacity = '0';
                    wrapper.style.transform = 'scale(0.85)';
                    // Delay hide display to allow transition
                    setTimeout(() => {
                        wrapper.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // --- 5. Floating Navbar Scroll Adjustments & Active Link Tracker ---
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Shrink navbar slightly and add styling on scroll
        if (scrollY > 50) {
            navbar.style.top = '1rem';
            navbar.style.padding = '0.6rem 1.8rem';
            navbar.style.background = 'rgba(11, 15, 25, 0.7)';
        } else {
            navbar.style.top = '1.5rem';
            navbar.style.padding = '0.8rem 2rem';
            navbar.style.background = 'rgba(15, 23, 42, 0.45)';
        }
        
        // Active link tracker based on current section viewport
        let currentSectionId = '';
        sections.forEach(sec => {
            const secTop = sec.offsetTop - 150;
            const secHeight = sec.offsetHeight;
            if (scrollY >= secTop && scrollY < secTop + secHeight) {
                currentSectionId = sec.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // --- 6. Mobile Navigation Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksList = document.getElementById('nav-links');
    
    if (menuToggle && navLinksList) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navLinksList.classList.toggle('open');
        });
        
        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                navLinksList.classList.remove('open');
            });
        });
    }

    // --- 7. Clock & Year Helpers ---
    const localTimeEl = document.getElementById('local-time');
    const currentYearEl = document.getElementById('current-year');
    
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }
    
    const updateClock = () => {
        if (!localTimeEl) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        localTimeEl.textContent = timeString;
    };
    updateClock();
    setInterval(updateClock, 1000);

    // --- 8. Contact Form Handler (Simulated Submit) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-circle-notch fa-spin"></i>';
            submitBtn.disabled = true;
            
            // Simulate API request delay
            setTimeout(() => {
                submitBtn.innerHTML = 'Message Sent! <i class="fa-solid fa-circle-check"></i>';
                submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                submitBtn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
                
                // Clear inputs
                contactForm.reset();
                
                // Revert button styling after 3 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                    submitBtn.style.background = '';
                    submitBtn.style.boxShadow = '';
                    submitBtn.disabled = false;
                }, 3000);
            }, 1800);
        });
    }
});
