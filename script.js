const progress = document.querySelector(".scroll-progress span");
const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateScrollState() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;

  let currentSection = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 150) currentSection = section;
  }
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${currentSection.id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Otwórz menu" : "Zamknij menu");
  mainNav.classList.toggle("open", !isOpen);
});
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otwórz menu");
    mainNav.classList.remove("open");
  });
});

const contactLink = document.querySelector(".header-contact");
const contactSection = document.querySelector("#contact");
let contactHighlightTimeout;
contactLink.addEventListener("click", (event) => {
  event.preventDefault();
  history.replaceState(null, "", "#contact");
  contactSection.scrollIntoView({ behavior: "smooth", block: "center" });
  contactSection.classList.remove("contact-highlight");
  requestAnimationFrame(() => contactSection.classList.add("contact-highlight"));
  clearTimeout(contactHighlightTimeout);
  contactHighlightTimeout = setTimeout(
    () => contactSection.classList.remove("contact-highlight"),
    2400,
  );
});

const tabs = [...document.querySelectorAll(".settings-tab")];
const panels = [...document.querySelectorAll(".settings-panel")];
function activateTab(tab, moveFocus = false) {
  const selected = tab.dataset.tab;
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === selected;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  if (moveFocus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    activateTab(tabs[nextIndex], true);
  });
});

const toast = document.querySelector(".toast");
let toastTimeout;
document.querySelector(".email-copy").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const email = button.dataset.copyEmail;
  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = "Adres e-mail skopiowany do schowka";
    button.querySelector(".copy-label").textContent = "COPIED";
  } catch {
    toast.textContent = `E-mail: ${email}`;
  }
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
    button.querySelector(".copy-label").textContent = "COPY";
  }, 2600);
});

document.querySelector("#year").textContent = new Date().getFullYear();

const avatarTrigger = document.querySelector("#avatar-trigger");
const avatarSound = document.querySelector("#avatar-sound");
let avatarAnimationTimeout;
avatarTrigger.addEventListener("click", () => {
  avatarSound.currentTime = 0;
  avatarSound.play()
    .then(() => {
      avatarTrigger.setAttribute("aria-label", "Odtwórz dźwięk");
      avatarTrigger.classList.add("is-playing");
    })
    .catch(() => {
      avatarTrigger.setAttribute("aria-label", "Nie udało się odtworzyć dźwięku");
      avatarTrigger.classList.remove("is-playing");
    });
  avatarTrigger.classList.remove("is-clicked");
  requestAnimationFrame(() => avatarTrigger.classList.add("is-clicked"));
  clearTimeout(avatarAnimationTimeout);
  avatarAnimationTimeout = setTimeout(() => avatarTrigger.classList.remove("is-clicked"), 650);
});
avatarSound.addEventListener("ended", () => avatarTrigger.classList.remove("is-playing"));

const streamStatus = document.querySelector("#stream-status");
const streamStatusTitle = document.querySelector("#stream-status-title");
const streamStatusDescription = document.querySelector("#stream-status-description");
const showStreamStatus = (title, description, state) => {
  streamStatusTitle.textContent = title;
  streamStatusDescription.textContent = description;
  streamStatus.dataset.state = state;
  streamStatus.hidden = false;
};

const twitchScript = document.createElement("script");
twitchScript.src = "https://player.twitch.tv/js/embed/v1.js";
twitchScript.async = true;
twitchScript.addEventListener("load", () => {
  if (!window.Twitch?.Player) {
    showStreamStatus("Player Twitch niedostępny", "Nie udało się załadować transmisji.", "error");
    return;
  }

  const player = new window.Twitch.Player("twitch-player", {
    width: "100%",
    height: "100%",
    channel: "blazzii_",
    autoplay: false,
    muted: true,
    parent: [location.hostname || "localhost"],
  });

  player.addEventListener(window.Twitch.Player.OFFLINE, () => {
    showStreamStatus("Blazzii jest offline", "Wpadnij na kanał, gdy transmisja ruszy.", "offline");
  });
  player.addEventListener(window.Twitch.Player.ONLINE, () => {
    streamStatus.hidden = true;
  });
  player.addEventListener(window.Twitch.Player.PLAYING, () => {
    streamStatus.hidden = true;
  });
});
twitchScript.addEventListener("error", () => {
  showStreamStatus("Player Twitch niedostępny", "Sprawdź połączenie lub odwiedź kanał bezpośrednio.", "error");
});
document.head.append(twitchScript);
