// The root layout renders no <html>, so this page brings its own (needed for the production build).
export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
        <h1>Page not found</h1>
        <p>
          <a href="/en">Go to Shifa</a>
        </p>
      </body>
    </html>
  );
}
