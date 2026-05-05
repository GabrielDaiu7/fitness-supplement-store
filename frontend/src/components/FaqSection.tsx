export function FaqSection() {
  return (
    <section className="faq" id="faq">
      <h2>Quick FAQ</h2>
      <details>
        <summary>How soon can we connect backend data?</summary>
        <p>The product grid supports API data from /api/products with offline fallback.</p>
      </details>
      <details>
        <summary>Can we add checkout next?</summary>
        <p>The cart now posts to /api/checkout and is ready for payment integration.</p>
      </details>
    </section>
  );
}
