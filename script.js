/**
 * Debounce function to limit the rate at which a function gets called.
 * @param {Function} func The function to debounce.
 * @param {number} wait The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check for user's motion preference for accessibility
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

document.addEventListener("DOMContentLoaded", () => {
  // Cache frequently accessed DOM elements
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".sidebar-nav a");
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const canvas = document.getElementById("bg-canvas");
  const body = document.body;

  /**
   * Toggles the mobile navigation sidebar and overlay.
   * @param {boolean} show - Force a specific state. true for show, false for hide.
   */
  const toggleSidebar = (show) => {
    const isVisible = sidebar.classList.contains("show");
    const showSidebar = show !== undefined ? show : !isVisible;

    hamburger.classList.toggle("active", showSidebar);
    sidebar.classList.toggle("show", showSidebar);
    overlay.classList.toggle("show", showSidebar);
    body.classList.toggle("sidebar-open", showSidebar);
    hamburger.setAttribute("aria-expanded", showSidebar);
  };

  // ===== Event Listeners for Sidebar =====
  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener("click", () => toggleSidebar());
    overlay.addEventListener("click", () => toggleSidebar(false));

    // Close sidebar when a link is clicked
    document.querySelectorAll(".sidebar a").forEach((link) => {
      link.addEventListener("click", () => {
        if (sidebar.classList.contains("show")) {
          toggleSidebar(false);
        }
      });
    });
  }

  // ===== Active Nav Link on Scroll (Intersection Observer) =====
  if (navLinks.length && sections.length) {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.55,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${id}`) {
              link.classList.add("active");
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ===== Enhanced Typing Animation =====
  const typewriterElement = document.getElementById("typing-effect");
  if (typewriterElement) {
    const phrases = ["developer.", "problem solver.", "computer engineer."];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeSpeed = 100;
    const deleteSpeed = 50;
    const delayBetweenPhrases = 2000;

    const animateTyping = () => {
      const currentPhrase = phrases[phraseIndex];
      let displayText = "";

      if (isDeleting) {
        displayText = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
      } else {
        displayText = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
      }

      typewriterElement.textContent = displayText;
      let timeout = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        timeout = delayBetweenPhrases;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }

      if (!prefersReducedMotion) {
        setTimeout(animateTyping, timeout);
      } else {
        typewriterElement.textContent = phrases[0]; // Show first phrase if motion is reduced
      }
    };
    setTimeout(animateTyping, 500);
  }

  // ===== Three.js Background Animation =====
  if (canvas && typeof THREE !== "undefined" && !prefersReducedMotion) {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.innerWidth > 768,
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const updateCanvasSize = () => {
        const sidebarWidth = window.innerWidth > 768 ? 80 : 0;
        const width = window.innerWidth - sidebarWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      updateCanvasSize();

      const isMobile = window.innerWidth <= 768;
      const particlesCount = isMobile ? 1500 : 5000;
      const particlesGeometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
      }
      particlesGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(posArray, 3)
      );

      const particlesMaterial = new THREE.PointsMaterial({
        size: isMobile ? 0.003 : 0.005,
        color: 0xa384ff,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const particlesMesh = new THREE.Points(
        particlesGeometry,
        particlesMaterial
      );
      scene.add(particlesMesh);
      camera.position.z = 2;

      const clock = new THREE.Clock();
      let animationId;

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.025;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = debounce(updateCanvasSize, 250);
      window.addEventListener("resize", handleResize);

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) cancelAnimationFrame(animationId);
        else animate();
      });
    } catch (error) {
      console.warn("Three.js animation failed to initialize:", error);
      canvas.style.display = "none"; // Hide canvas on error
    }
  }

  // ===== Lazy Loading Images with Intersection Observer =====
  const lazyImages = document.querySelectorAll("img[data-src]");
  if ("IntersectionObserver" in window && lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            img.onload = () => (img.style.opacity = "1");
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "100px" }
    );

    lazyImages.forEach((img) => {
      img.style.opacity = "0";
      img.style.transition = "opacity 0.3s";
      imageObserver.observe(img);
    });
  } else {
    // Fallback for older browsers
    lazyImages.forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
  }

  // ===== Smooth Scroll for Anchor Links =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  // ===== Accessibility: Keyboard Navigation Enhancement =====
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("show")) {
      toggleSidebar(false);
      hamburger.focus();
    }
  });

  console.log("✨ Portfolio initialized successfully!");
});
