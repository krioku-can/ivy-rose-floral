/**
 * Ivy & Rose Floral Co. - Main JavaScript
 * Vanilla JS, ES6+ syntax
 */

// ============================================================
// PERFORMANCE UTILITIES
// ============================================================

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const rAF = (callback) => {
  return requestAnimationFrame(callback);
};

// ============================================================
// SMOOTH SCROLL & ACTIVE NAV
// ============================================================

const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = document.querySelector('header')?.offsetHeight || 0;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Close mobile nav if open
        const nav = document.querySelector('.main-nav');
        const menuToggle = document.querySelector('.menu-toggle');
        const navBackdrop = document.getElementById('navBackdrop');
        if (nav && nav.classList.contains('active')) {
          nav.classList.remove('active');
          navBackdrop?.classList.remove('active');
          menuToggle?.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      }
    });
  });
};

const initActiveNav = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  const onScroll = debounce(() => {
    const scrollPos = window.scrollY + 150;
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });
};

// ============================================================
// MOBILE NAVIGATION (with backdrop)
// ============================================================

const initMobileNav = () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const navBackdrop = document.getElementById('navBackdrop');

  if (!menuToggle || !mainNav) return;

  const toggleNav = () => {
    const isOpen = mainNav.classList.toggle('active');
    navBackdrop?.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  menuToggle.addEventListener('click', toggleNav);
  navBackdrop?.addEventListener('click', toggleNav);

  // Close menu when a nav link is clicked
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        navBackdrop?.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      navBackdrop?.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
};

// ============================================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================================

const initScrollAnimations = () => {
  const animatedElements = document.querySelectorAll('[data-animate]');
  if (!animatedElements.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Handle staggered grid items
        const gridItems = el.querySelectorAll('[data-stagger]');
        if (gridItems.length) {
          gridItems.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
            item.classList.add('animate-in');
          });
        } else {
          el.classList.add('animate-in');
        }
        // Trigger only once
        obs.unobserve(el);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => observer.observe(el));
};

// ============================================================
// FORM VALIDATION
// ============================================================

const validators = {
  required: (value) => value.trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^[\d\s\-\(\)\+]{10,}$/.test(value.replace(/\s/g, ''))
};

const showFieldError = (input, message) => {
  const formGroup = input.closest('.form-group') || input.parentElement;
  let errorEl = formGroup.querySelector('.error-message');

  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'error-message';
    formGroup.appendChild(errorEl);
  }

  input.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
};

const clearFieldError = (input) => {
  const formGroup = input.closest('.form-group') || input.parentElement;
  const errorEl = formGroup.querySelector('.error-message');

  input.classList.remove('invalid');
  input.setAttribute('aria-invalid', 'false');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
};

const validateField = (input) => {
  const type = input.type;
  const value = input.value;
  const isRequired = input.required || input.hasAttribute('data-required');

  if (isRequired && !validators.required(value)) {
    showFieldError(input, 'This field is required.');
    return false;
  }

  if (value) {
    if (type === 'email' && !validators.email(value)) {
      showFieldError(input, 'Please enter a valid email address.');
      return false;
    }
    if (input.name?.toLowerCase().includes('phone') && !validators.phone(value)) {
      showFieldError(input, 'Please enter a valid phone number.');
      return false;
    }
  }

  clearFieldError(input);
  return true;
};

const initFormValidation = () => {
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');

    // Real-time validation on blur
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) {
          validateField(input);
        }
      });
    });

    // Submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Prevent double submission
      const submitBtn = form.querySelector('button[type="submit"], [data-submit]');
      if (submitBtn && submitBtn.disabled) return;

      let isValid = true;
      inputs.forEach(input => {
        if (!validateField(input)) isValid = false;
      });

      if (!isValid) {
        // Focus first invalid field
        const firstInvalid = form.querySelector('.invalid');
        firstInvalid?.focus();
        return;
      }

      // Disable button to prevent double submission
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
      }

      // Show success message
      const successEl = form.querySelector('.form-success');
      if (successEl) {
        successEl.classList.add('visible');
        successEl.setAttribute('aria-live', 'polite');
      }

      // Simulate submission (replace with actual fetch/POST)
      setTimeout(() => {
        form.reset();
        if (successEl) {
          successEl.textContent = 'Thank you! Your message has been sent.';
        }

        // Reset submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Send';
        }

        // Hide success message after delay
        setTimeout(() => {
          successEl?.classList.remove('visible');
        }, 5000);
      }, 1500);
    });
  });
};

// ============================================================
// FORM ENHANCEMENTS
// ============================================================

const initCharacterCounter = () => {
  document.querySelectorAll('textarea[data-max-length]').forEach(textarea => {
    const maxLength = parseInt(textarea.dataset.maxLength, 10);
    const formGroup = textarea.closest('.form-group') || textarea.parentElement;

    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.textContent = `0 / ${maxLength}`;
    formGroup.appendChild(counter);

    textarea.addEventListener('input', () => {
      const current = textarea.value.length;
      counter.textContent = `${current} / ${maxLength}`;
      counter.classList.toggle('at-limit', current >= maxLength);
    });
  });
};

const initDynamicPrice = () => {
  const bouquetSelect = document.querySelector('select[name="bouquet"], [data-bouquet-select]');
  const priceDisplay = document.querySelector('[data-price-display]');

  if (!bouquetSelect || !priceDisplay) return;

  const prices = {};
  bouquetSelect.querySelectorAll('option').forEach(opt => {
    if (opt.value && opt.dataset.price) {
      prices[opt.value] = opt.dataset.price;
    }
  });

  bouquetSelect.addEventListener('change', () => {
    const selected = bouquetSelect.value;
    const price = prices[selected];
    if (price) {
      rAF(() => {
        priceDisplay.textContent = `$${price}`;
        priceDisplay.classList.add('price-updated');
        setTimeout(() => priceDisplay.classList.remove('price-updated'), 300);
      });
    } else {
      priceDisplay.textContent = '';
    }
  });
};

const initDatePicker = () => {
  const dateInputs = document.querySelectorAll('input[type="date"], [data-date-picker]');
  const today = new Date().toISOString().split('T')[0];

  dateInputs.forEach(input => {
    input.setAttribute('min', today);

    // Auto-fill with today's date if empty and data-auto-fill is present
    if (input.hasAttribute('data-auto-fill') && !input.value) {
      input.value = today;
    }
  });
};

// ============================================================
// GALLERY FILTERING
// ============================================================

const initGalleryFilter = () => {
  const filterContainer = document.querySelector('[data-filter]');
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll('[data-filter-btn]');
  const items = document.querySelectorAll('[data-category]');
  const galleryGrid = document.querySelector('.gallery-grid');

  if (!items.length) return;

  // Create "No results" message
  const noResults = document.createElement('p');
  noResults.className = 'no-results';
  noResults.textContent = 'No bouquets found in this category.';
  noResults.style.display = 'none';
  galleryGrid?.parentElement?.appendChild(noResults);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.filterBtn;

      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      let visibleCount = 0;

      items.forEach(item => {
        const itemCategory = item.dataset.category;
        const matches = category === 'all' || itemCategory === category;

        if (matches) {
          item.classList.remove('hidden');
          rAF(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
          visibleCount++;
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => item.classList.add('hidden'), 300);
        }
      });

      // Show/hide no results message
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    });
  });
};

// ============================================================
// LAZY LOADING
// ============================================================

const initLazyLoading = () => {
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (!lazyImages.length) return;

  // Add placeholder styles if not present
  lazyImages.forEach(img => {
    img.classList.add('lazy-image');
    img.style.backgroundColor = '#f0e6e0'; // Placeholder color
  });

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) {
          const tempImg = new Image();
          tempImg.src = src;
          tempImg.onload = () => {
            rAF(() => {
              img.src = src;
              if (srcset) img.srcset = srcset;
              img.classList.add('loaded');
              img.removeAttribute('data-src');
              img.removeAttribute('data-srcset');
            });
          };
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '200px 0px'
  });

  lazyImages.forEach(img => imageObserver.observe(img));
};

// ============================================================
// INITIALIZATION
// ============================================================

const init = () => {
  initSmoothScroll();
  initActiveNav();
  initMobileNav();
  initScrollAnimations();
  initFormValidation();
  initCharacterCounter();
  initDynamicPrice();
  initDatePicker();
  initGalleryFilter();
  initLazyLoading();
};

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
