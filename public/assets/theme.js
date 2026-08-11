/* Whole-app theme switcher: Teal (default), Ocean, Sunset, Dark.
 *
 * Only applies the stored theme + exposes the getter/setter here — every
 * page loads this so the choice actually shows up everywhere. The picker
 * UI itself lives only in Hồ sơ > Cài đặt & Tùy chọn (see index.html's
 * injected "Giao diện" row), not floating on every screen.
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
  window.__APP_THEMES__ = THEMES;
  window.__APP_THEME_META__ = THEME_META;

  // Runs immediately (this script is a blocking <head> script, not
  // deferred) so the theme is set before first paint — no flash.
  apply(getAppTheme());
})();
