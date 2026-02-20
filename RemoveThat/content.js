let removeMode = false;
let previousCursor = "";
let tooltip = null;
let lastHovered = null;

const HIGHLIGHT_CLASS = "remove-element-highlight";
const STYLE_ID = "remove-element-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid #ff4d4d !important;
      outline-offset: -1px !important;
      background: rgba(255, 77, 77, 0.05) !important;
      transition: none !important;           
      cursor: crosshair !important;
    }
    * { will-change: transform, opacity; }   
  `;
  document.head.appendChild(style);
}

function createParticles(x, y) {
  const colors = ["#ff4d4d", "#ff8080", "#ffb3b3"];
  const container = document.body || document.documentElement;

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[i % colors.length]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999999;
      will-change: transform, opacity;
      transform: translate(-50%, -50%);
    `;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 40 + 20;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    const anim = p.animate(
      [
        { transform: `translate(-50%, -50%) translate(0,0)`, opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px)`, opacity: 0 }
      ],
      {
        duration: 300 + Math.random() * 200,
        easing: "ease-out"
      }
    );

    container.appendChild(p);

    
    anim.onfinish = () => p.remove();
    
    setTimeout(() => p.remove(), 600);
  }
}

function highlightElement(el) {
  if (!removeMode || !el) return;
  if (lastHovered === el) return;

  if (lastHovered) {
    lastHovered.classList.remove(HIGHLIGHT_CLASS);
  }

  if (el !== document.body && el !== document.documentElement &&
      (!tooltip || !tooltip.contains(el))) {
    el.classList.add(HIGHLIGHT_CLASS);
    lastHovered = el;
  } else {
    lastHovered = null;
  }
}

function removeElement(el, clientX, clientY) {
  if (!el || el === document.body || el === document.documentElement) return;

  try {
    
    if (lastHovered === el) {
      el.classList.remove(HIGHLIGHT_CLASS);
      lastHovered = null;
    }

    if (clientX && clientY) {
      createParticles(clientX, clientY);
    }

    
    el.remove();

    console.log("[RemoveElement] Удалён:", el.tagName, el.id || el.className || el.classList);

  } catch (err) {
    console.error("[RemoveElement] Ошибка:", err);
  }
}

function enableRemoveMode() {
  if (removeMode) return;
  removeMode = true;
  previousCursor = document.body.style.cursor;
  document.body.style.cursor = "crosshair";

  injectStyles();

  tooltip = document.createElement("div");
  tooltip.style.cssText = `position:fixed;top:12px;right:12px;background:rgba(220,53,69,0.9);color:white;padding:8px 14px;border-radius:6px;z-index:999999;font-family:system-ui,sans-serif;font-size:14px;pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,0.4);`;
  tooltip.textContent = "Режим удаления • Esc — выход";
  document.body.appendChild(tooltip);

  document.addEventListener("mouseover", onMouseOver, true);
}

function disableRemoveMode() {
  if (!removeMode) return;
  removeMode = false;
  document.body.style.cursor = previousCursor || "";

  if (tooltip) tooltip.remove();
  tooltip = null;

  if (lastHovered) {
    lastHovered.classList.remove(HIGHLIGHT_CLASS);
    lastHovered = null;
  }

  document.removeEventListener("mouseover", onMouseOver, true);
}

function onMouseOver(e) {
  if (!removeMode) return;
  highlightElement(e.target);
}

// ──────────────────────────────────────────────

document.addEventListener("click", e => {
  if (!removeMode) return;
  e.preventDefault();
  e.stopPropagation();

  if (tooltip && tooltip.contains(e.target)) return;

  removeElement(e.target, e.clientX, e.clientY);
}, true);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && removeMode) {
    disableRemoveMode();
    e.preventDefault();
  }
}, true);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggleRemoveMode") {
    removeMode ? disableRemoveMode() : enableRemoveMode();
    sendResponse({ success: true, active: removeMode });
  }
});