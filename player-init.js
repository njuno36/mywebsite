// Shared player initialization for all pages
// Depends on Plyr being loaded first (include plyr.polyfilled.js before this)

// Ensure CSS vars reflect current header/footer heights so video height calc works
function updateHeights() {
  const nav = document.querySelector('nav');
  const footer = document.querySelector('footer');
  const navHeight = nav ? nav.offsetHeight : 0;
  const footerHeight = footer ? footer.offsetHeight : 0;
  document.documentElement.style.setProperty('--nav-height', navHeight + 'px');
  document.documentElement.style.setProperty('--footer-height', footerHeight + 'px');
}
window.addEventListener('resize', updateHeights);

// Debounce helper
function debounce(fn, wait = 80) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Anchor Plyr controls to the bottom edge of the visible video element
function updateControlsPosition() {
  document.querySelectorAll('.video-fill .plyr').forEach((plyrEl) => {
    const video = plyrEl.querySelector('video');
    const controls = plyrEl.querySelector('.plyr__controls');
    const wrapper = plyrEl.querySelector('.plyr__video-wrapper') || plyrEl;
    if (!video || !controls || !wrapper) return;

    // Container dimensions (where the video is laid out)
    const cw = wrapper.clientWidth;
    const ch = wrapper.clientHeight;

    // Intrinsic video dimensions; fallback to 16:9 if missing
    let vw = video.videoWidth || 16;
    let vh = video.videoHeight || 9;
    if (!vw || !vh) { vw = 16; vh = 9; }

    const containerRatio = cw / ch;
    const videoRatio = vw / vh;

    // Compute displayed size of the video when using object-fit: contain
    let displayedWidth, displayedHeight;
    if (containerRatio > videoRatio) {
      displayedHeight = ch;
      displayedWidth = ch * videoRatio;
    } else {
      displayedWidth = cw;
      displayedHeight = cw / videoRatio;
    }

    // Top offset of the displayed video within the wrapper
    const topOffset = Math.round((ch - displayedHeight) / 2);

    const controlsHeight = controls.offsetHeight || 0;
    let topWithinPlyr = topOffset + displayedHeight - controlsHeight;

    // Clamp
    const maxTop = Math.max(0, plyrEl.clientHeight - controlsHeight);
    if (topWithinPlyr < 0) topWithinPlyr = 0;
    if (topWithinPlyr > maxTop) topWithinPlyr = maxTop;

    controls.style.position = 'absolute';
    controls.style.top = topWithinPlyr + 'px';
    controls.style.bottom = 'auto';
  });
}

const debouncedUpdateControls = debounce(() => {
  updateHeights();
  updateControlsPosition();
}, 100);
window.addEventListener('resize', debouncedUpdateControls);

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateHeights();
  document.querySelectorAll('video').forEach((video) => {
    if (!video.closest('main')) return;

    // Find logical wrapper for the video
    const wrapper = video.closest('.video-fill') || video.parentElement;
    if (!wrapper) return;

    // prefer an existing overlay in the wrapper, otherwise the global id used on index
    let overlayButton = wrapper.querySelector('.video-overlay-play') || document.getElementById('video-overlay-play');
    if (!overlayButton) {
      overlayButton = document.createElement('button');
      overlayButton.type = 'button';
      overlayButton.className = 'video-overlay-play';
      overlayButton.setAttribute('aria-label', 'Play video');
      overlayButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>';
      wrapper.prepend(overlayButton);
    }

    new Plyr(video, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      keyboard: { focused: true, global: true },
      ratio: '16:9'
    });

    // After player init, ensure controls are anchored correctly
    setTimeout(() => {
      updateControlsPosition();
    }, 120);

    // Reposition on metadata load and observe wrapper size changes
    video.addEventListener('loadedmetadata', () => {
      updateControlsPosition();
    });
    const wrapperForObserver = video.closest('.plyr__video-wrapper') || video.parentElement;
    if (window.ResizeObserver && wrapperForObserver) {
      const ro = new ResizeObserver(() => updateControlsPosition());
      ro.observe(wrapperForObserver);
    }

    if (overlayButton) {
      const updateOverlayButton = () => {
        const svgPath = overlayButton.querySelector('svg path');
        const atStart = video.currentTime === 0;

        if (video.ended) {
          if (svgPath) {
            svgPath.setAttribute('d', 'M12 5V1L8 5l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z');
          }
          overlayButton.classList.remove('is-hidden');
          overlayButton.setAttribute('aria-label', 'Replay video');
        } else if (atStart && video.paused) {
          if (svgPath) {
            svgPath.setAttribute('d', 'M8 5v14l11-7z');
          }
          overlayButton.classList.remove('is-hidden');
          overlayButton.setAttribute('aria-label', 'Play video');
        } else {
          overlayButton.classList.add('is-hidden');
        }
      };

      overlayButton.addEventListener('click', () => {
        if (video.ended) {
          video.currentTime = 0;
        }
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });

      video.addEventListener('play', updateOverlayButton);
      video.addEventListener('pause', updateOverlayButton);
      video.addEventListener('ended', updateOverlayButton);
      video.addEventListener('seeked', updateOverlayButton);
      updateOverlayButton();
    }
  });
});
