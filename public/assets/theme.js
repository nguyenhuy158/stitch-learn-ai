/* Whole-app theme switcher: Teal (default), Ocean, Sunset, Dark.
 *
 * The compiled SPA bundle (index.html) already ships ~160 Tailwind
 * `dark:` rules but never toggles the `dark` class, so "Dark" here is a
 * real, native dark mode there. Ocean/Sunset have no such hooks — the
 * bundle's brand colors are baked into hardcoded hex utility classes with
 * no source to edit — so those two are approximated with a CSS
 * `filter: hue-rotate()` on the React root (index.html adds that rule
 * itself; see its inline <style>). The 8 static pages use real
 * `--teal-dark`/`--orange`/etc CSS variables (theme.css), so they get exact
 * palettes for every theme, not an approximation.
 */
(function () {
  var THEMES = ["teal", "ocean", "sunset", "dark"];
  var STORAGE_KEY = "app_theme";
  var THEME_META = {
    teal: { label: "Teal", color: "#0f766e" },
    ocean: { label: "Ocean", color: "#216d94" },
    sunset: { label: "Sunset", color: "#a64f36" },
    dark: { label: "Dark", color: "#14b8a6" }
  };

  function getAppTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.indexOf(stored) !== -1 ? stored : "teal";
  }

  function apply(theme) {
    if (THEMES.indexOf(theme) === -1) theme = "teal";
    document.documentElement.setAttribute("data-theme", theme);
    // Drives the bundle's existing Tailwind `dark:` utility classes.
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme !== "dark");
  }

  window.setAppTheme = function (theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    apply(theme);
  };
  window.getAppTheme = getAppTheme;

  // Runs immediately (this script is a blocking <head> script, not
  // deferred) so the theme is set before first paint — no flash.
  apply(getAppTheme());

  function buildPicker() {
    if (document.getElementById("app-theme-fab")) return;

    var fab = document.createElement("button");
    fab.id = "app-theme-fab";
    fab.type = "button";
    fab.textContent = "🎨";
    fab.setAttribute("aria-label", "Đổi giao diện");

    var menu = document.createElement("div");
    menu.id = "app-theme-menu";

    THEMES.forEach(function (key) {
      var meta = THEME_META[key];
      var item = document.createElement("button");
      item.type = "button";
      item.innerHTML =
        '<span class="swatch" style="background:' + meta.color + '"></span><span>' + meta.label + "</span>";
      item.addEventListener("click", function () {
        window.setAppTheme(key);
        menu.classList.remove("open");
      });
      menu.appendChild(item);
    });

    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", function () {
      menu.classList.remove("open");
    });

    document.body.appendChild(fab);
    document.body.appendChild(menu);
  }

  document.addEventListener("DOMContentLoaded", buildPicker);
})();
