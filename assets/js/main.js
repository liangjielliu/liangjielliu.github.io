const mastheadPx = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue("--masthead-height"),
  10
);

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function handleAnchorClick(event) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - mastheadPx;
    window.scrollTo({ top, behavior: "smooth" });
    document.getElementById("mastheadNav")?.classList.remove("open");
  });
});

document.getElementById("mastheadToggle")?.addEventListener("click", () => {
  document.getElementById("mastheadNav")?.classList.toggle("open");
});

const allNavLinks = document.querySelectorAll(".masthead-nav .nav-link");
const sections = document.querySelectorAll("main section[id]");
const linkMap = {};

allNavLinks.forEach((link) => {
  const id = link.getAttribute("href")?.slice(1);
  if (!id) return;
  if (!linkMap[id]) linkMap[id] = [];
  linkMap[id].push(link);
});

function setActive(id) {
  allNavLinks.forEach((link) => link.classList.remove("active"));
  if (linkMap[id]) linkMap[id].forEach((link) => link.classList.add("active"));
}

const observer = new IntersectionObserver(
  (entries) => {
    let topEntry = null;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
          topEntry = entry;
        }
      }
    });
    if (topEntry) setActive(topEntry.target.id);
  },
  {
    rootMargin: `${-(mastheadPx + 10)}px 0px -55% 0px`,
    threshold: 0,
  }
);

sections.forEach((section) => observer.observe(section));
