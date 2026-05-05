export function Hero() {
  return (
    <section className="hero">
      <div className="shell hero-grid">
        <div>
          <p className="kicker">25,000+ verified reviews</p>
          <h1>Fuel your evolution.</h1>
          <p className="hero-copy">
            Fully-dosed performance supplements for athletes and lifters who want measurable
            results, transparent labels, and clean formulas.
          </p>
          <div className="hero-actions">
            <button className="btn btn-solid">Shop All Products</button>
            <button className="btn btn-outline">Build Your Stack</button>
          </div>
        </div>
        <div className="hero-panel">
          <h3>Performance Promise</h3>
          <ul>
            <li>Clinically relevant ingredient dosing</li>
            <li>Third-party tested every batch</li>
            <li>Fast shipping and easy returns</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
