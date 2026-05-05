import { stackCards } from '../data/storefront';

export function StackSection() {
  return (
    <section className="stack-grid" id="stacks">
      {stackCards.map((stack) => (
        <article key={stack.title}>
          <h3>{stack.title}</h3>
          <p>{stack.body}</p>
          <a href="#">Shop Stack</a>
        </article>
      ))}
    </section>
  );
}
