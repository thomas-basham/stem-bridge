import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found-card">
      <p className="not-found-card__eyebrow">Navigation</p>
      <h3>That view is not available in the MVP.</h3>
      <p>Return to the dashboard and keep building out the collaboration workflow.</p>
      <Link to="/" className="control-button control-button--link">
        Back to Dashboard
      </Link>
    </section>
  );
}
