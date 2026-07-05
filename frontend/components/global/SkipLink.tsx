/**
 * Skip link — first focusable element on every page. Lets keyboard and
 * screen-reader users jump past the nav straight to page content. Invisible
 * until focused (see .visually-hidden:focus in globals.css).
 * @author Saamarth Attray
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="visually-hidden">
      Skip to main content
    </a>
  );
}