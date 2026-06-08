import { useMemo, useState } from 'react';
import type { Product } from '../types';

type StackBuilderPageProps = {
  products: Product[];
  formatPrice: (usdAmount: number) => string;
  onAddBundle: (bundleCode: string, productIds: readonly number[]) => void;
};

const stackDefinitions = {
  PERFORMANCE: {
    title: 'Elite Performance Stack',
    productIds: [3, 2, 6],
    goals: ['muscle', 'performance'],
    copy: 'Pre-workout, creatine, and electrolytes for output, strength, and training hydration.',
  },
  WELLNESS: {
    title: 'Daily Wellness Stack',
    productIds: [4, 5, 6],
    goals: ['recovery', 'wellness'],
    copy: 'Daily micronutrients, omega-3 support, and hydration for consistent baseline health.',
  },
  LEAN: {
    title: 'Lean Physique Stack',
    productIds: [10, 6, 3],
    goals: ['fat-loss', 'lean'],
    copy: 'Plant protein, hydration, and focused training energy for body-composition routines.',
  },
} as const;

export function StackBuilderPage({ products, formatPrice, onAddBundle }: StackBuilderPageProps) {
  const [goal, setGoal] = useState('muscle');
  const [diet, setDiet] = useState('omnivore');
  const [trainingFrequency, setTrainingFrequency] = useState('3-4');
  const [caffeine, setCaffeine] = useState('yes');
  const [budget, setBudget] = useState('120');

  const recommendation = useMemo(() => {
    if (diet === 'vegan') return stackDefinitions.LEAN;
    if (goal === 'recovery' || caffeine === 'no') return stackDefinitions.WELLNESS;
    if (goal === 'fat-loss') return stackDefinitions.LEAN;
    return stackDefinitions.PERFORMANCE;
  }, [caffeine, diet, goal]);

  const recommendedProducts = recommendation.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
  const rawTotal = recommendedProducts.reduce((sum, product) => sum + product.price, 0);
  const bundleTotal = rawTotal * 0.9;
  const overBudget = rawTotal > Number(budget);

  return (
    <main className="shell page-block stack-builder-page">
      <section className="page-banner">
        <p>Personalized Stack</p>
        <h2>Build Your Stack</h2>
      </section>

      <section className="stack-builder-layout">
        <form className="account-panel stack-builder-form">
          <h3>Training Profile</h3>
          <label>Goal
            <select className="checkout-input" value={goal} onChange={(event) => setGoal(event.target.value)}>
              <option value="muscle">Build muscle</option>
              <option value="fat-loss">Lean down</option>
              <option value="recovery">Recovery and wellness</option>
            </select>
          </label>
          <label>Diet
            <select className="checkout-input" value={diet} onChange={(event) => setDiet(event.target.value)}>
              <option value="omnivore">Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>
          <label>Training frequency
            <select className="checkout-input" value={trainingFrequency} onChange={(event) => setTrainingFrequency(event.target.value)}>
              <option value="1-2">1-2 sessions per week</option>
              <option value="3-4">3-4 sessions per week</option>
              <option value="5-6">5-6 sessions per week</option>
              <option value="daily">Daily</option>
            </select>
          </label>
          <label>Caffeine tolerance
            <select className="checkout-input" value={caffeine} onChange={(event) => setCaffeine(event.target.value)}>
              <option value="yes">Comfortable with caffeine</option>
              <option value="low">Low tolerance</option>
              <option value="no">Avoid caffeine</option>
            </select>
          </label>
          <label>Budget
            <select className="checkout-input" value={budget} onChange={(event) => setBudget(event.target.value)}>
              <option value="80">Under $80</option>
              <option value="120">Under $120</option>
              <option value="180">Under $180</option>
            </select>
          </label>
        </form>

        <section className="account-panel stack-builder-result">
          <p className="label">Recommended</p>
          <h3>{recommendation.title}</h3>
          <p className="state">{recommendation.copy}</p>
          {overBudget && <p className="state warn">This full stack is above your selected budget, but the bundle discount still applies.</p>}
          <div className="review-list">
            {recommendedProducts.map((product) => (
              <p key={product.id}><strong>{product.name}</strong> - {formatPrice(product.price)}</p>
            ))}
          </div>
          <p className="review-total">Bundle: {formatPrice(bundleTotal)} <span className="state">10% stack discount at checkout</span></p>
          <button className="btn btn-solid" onClick={() => onAddBundle(recommendation.title.includes('Wellness') ? 'WELLNESS' : recommendation.title.includes('Lean') ? 'LEAN' : 'PERFORMANCE', recommendation.productIds)}>
            Add Complete Stack
          </button>
        </section>
      </section>
    </main>
  );
}
