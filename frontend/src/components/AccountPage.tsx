import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createAddress,
  createPaymentMethod,
  createSupportTicket,
  fetchAddresses,
  fetchOrderDetails,
  fetchOrders,
  fetchPaymentMethods,
  fetchSupportTickets,
  reorderOrder,
  submitDataRequest,
  updateOnboardingProfile,
} from '../lib/api';
import type { Address, PaymentMethod, Product, User } from '../types';

type AccountPageProps = {
  account: User;
  products: Product[];
  formatPrice: (usdAmount: number) => string;
  onResendVerification: (email: string) => Promise<string | null>;
  onVerifyEmail: (code: string) => Promise<boolean>;
  onProfileSaved: () => Promise<void>;
  onReorder: (items: Array<{ id: number; quantity: number }>) => void;
};

export function AccountPage({
  account,
  products,
  formatPrice,
  onResendVerification,
  onVerifyEmail,
  onProfileSaved,
  onReorder,
}: AccountPageProps) {
  const [orders, setOrders] = useState<Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, { items: Array<{ productId: number; name: string; quantity: number; unitPrice: number }> }>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [tickets, setTickets] = useState<Array<{ id: number; issueType: string; message: string; status: string; returnStatus: string; createdAt: string; orderCode?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('');
  const [goal, setGoal] = useState(account.goal ?? '');
  const [dietType, setDietType] = useState(account.dietType ?? '');
  const [trainingFrequency, setTrainingFrequency] = useState(account.trainingFrequency ?? '');
  const [preferredShippingAddress, setPreferredShippingAddress] = useState(account.preferredShippingAddress ?? '');
  const [preferredCurrency, setPreferredCurrency] = useState(account.preferredCurrency ?? 'USD');
  const [defaultSubscribeFrequency, setDefaultSubscribeFrequency] = useState(account.defaultSubscribeFrequency ?? '');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationState, setVerificationState] = useState('');
  const [addressForm, setAddressForm] = useState({ fullName: account.name, email: account.email, address: '', city: '', zip: '' });
  const [paymentForm, setPaymentForm] = useState({ cardBrand: 'Visa', cardNumber: '', expMonth: 1, expYear: new Date().getFullYear() + 1 });
  const [supportForm, setSupportForm] = useState({ orderCode: '', issueType: 'order_issue', message: '', returnRequested: false });

  const goalOptions = ['muscle', 'fat-loss', 'recovery'];
  const dietOptions = ['omnivore', 'keto', 'vegan', 'vegetarian', 'pescatarian'];
  const trainingOptions = ['1-2x per week', '3-4x per week', '5-6x per week', 'daily'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  const subscriptionOptions = ['Weekly', 'Bi-weekly', 'Monthly', 'Every 6 weeks', 'Quarterly'];

  useEffect(() => {
    Promise.all([fetchOrders(), fetchAddresses(), fetchPaymentMethods(), fetchSupportTickets()])
      .then(([o, a, p, t]) => {
        setOrders(o);
        setAddresses(a);
        setPaymentMethods(p);
        setTickets(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const checklist = useMemo(
    () => [
      { label: 'Verify email', done: Boolean(account.emailVerified), action: 'Enter verification code above' },
      { label: 'Complete profile', done: Boolean(goal && dietType && trainingFrequency), action: 'Choose goal, diet, and training frequency' },
      { label: 'Add default address', done: Boolean(addresses.length), action: 'Save your shipping address' },
      { label: 'Add payment method', done: Boolean(paymentMethods.length), action: 'Store your preferred card' },
      { label: 'Get tailored stack', done: Boolean(goal && dietType), action: 'Review suggested products below' },
    ],
    [account.emailVerified, goal, dietType, trainingFrequency, addresses.length, paymentMethods.length]
  );
  const completedCount = checklist.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);
  const nextBestAction = checklist.find((c) => !c.done)?.action ?? 'Great job. Your onboarding is complete.';

  const recommendations = useMemo(() => {
    if (!goal) return products.slice(0, 3);
    const match = products.filter((p) => (p.goals ?? []).some((g) => g.toLowerCase().includes(goal.toLowerCase())));
    return (match.length ? match : products).slice(0, 3);
  }, [products, goal]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState('Saving...');
    const ok = await updateOnboardingProfile({
      goal,
      dietType,
      trainingFrequency,
      preferredShippingAddress,
      preferredCurrency,
      defaultSubscribeFrequency,
    });
    if (!ok) return setSaveState('Unable to save profile defaults.');
    await onProfileSaved();
    setSaveState('Profile defaults saved.');
  }

  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>Account Dashboard</p>
        <h2>Welcome, {account.name}</h2>
      </section>

      {!account.emailVerified && (
        <section className="account-panel account-alert">
          <h3>Verify your email</h3>
          <p className="state">Please verify your email to unlock checkout and account actions.</p>
          <label className="verify-code-label">Verification code
            <input className="verify-code-input" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter 6-digit code" maxLength={6} />
          </label>
          <div className="verify-code-actions">
            <button className="btn btn-solid" onClick={async () => setVerificationState((await onVerifyEmail(verificationCode.trim())) ? 'Email verified successfully.' : 'Invalid/expired verification code.')}>Verify code</button>
            <button className="btn btn-ghost" onClick={async () => { await onResendVerification(account.email); setVerificationState('Verification code sent.'); }}>Resend code</button>
          </div>
          {verificationState && <p className="state verify-code-state">{verificationState}</p>}
        </section>
      )}

      <section className="account-grid">
        <article className="account-panel">
          <h3>Onboarding Progress</h3>
          <p className="state">{progressPercent}% complete</p>
          <p className="state"><strong>Next best action:</strong> {nextBestAction}</p>
          <div className="account-checklist">
            {checklist.map((item) => <p key={item.label}>{item.done ? '[x]' : '[ ]'} {item.label}</p>)}
          </div>
        </article>
      </section>

      <section className="account-panel">
        <h3>Profile Setup</h3>
        <form className="login-form" onSubmit={handleSave}>
          <label>Goal<select value={goal} onChange={(e) => setGoal(e.target.value)} className="checkout-input"><option value="">Select goal</option>{goalOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
          <label>Dietary type<select value={dietType} onChange={(e) => setDietType(e.target.value)} className="checkout-input"><option value="">Select dietary type</option>{dietOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
          <label>Training frequency<select value={trainingFrequency} onChange={(e) => setTrainingFrequency(e.target.value)} className="checkout-input"><option value="">Select training frequency</option>{trainingOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
          <label>Preferred shipping address<input value={preferredShippingAddress} onChange={(e) => setPreferredShippingAddress(e.target.value)} placeholder="123 Main St, Paris" /></label>
          <label>Preferred currency<select value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)} className="checkout-input">{currencyOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
          <label>Subscription frequency<select value={defaultSubscribeFrequency} onChange={(e) => setDefaultSubscribeFrequency(e.target.value)} className="checkout-input"><option value="">Select subscription frequency</option>{subscriptionOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
          <button className="btn btn-solid" type="submit">Save defaults</button>
          {saveState && <p className="state">{saveState}</p>}
        </form>
      </section>

      <section className="account-panel">
        <h3>Recommended Stack</h3>
        <div className="product-grid">
          {recommendations.map((product) => (
            <article key={product.id} className="product-card">
              <img className="product-image" src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-foot"><span>{formatPrice(product.price)}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="account-grid">
        <article className="account-panel">
          <h3>Address Book</h3>
          {addresses.map((a) => <p key={a.id}>{a.fullName} - {a.address}, {a.city} {a.zip}{a.isDefault ? ' (Default)' : ''}</p>)}
          <form className="login-form" onSubmit={async (e) => {
            e.preventDefault();
            const created = await createAddress({ ...addressForm, isDefault: addresses.length === 0 });
            setAddresses((prev) => [created, ...prev]);
            setAddressForm({ fullName: account.name, email: account.email, address: '', city: '', zip: '' });
          }}>
            <label>Address<input value={addressForm.address} onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))} /></label>
            <label>City<input value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} /></label>
            <label>ZIP<input value={addressForm.zip} onChange={(e) => setAddressForm((p) => ({ ...p, zip: e.target.value }))} /></label>
            <button className="btn btn-ghost" type="submit">Add address</button>
          </form>
        </article>
        <article className="account-panel">
          <h3>Payment Methods</h3>
          {paymentMethods.map((m) => <p key={m.id}>{m.cardBrand} ending in {m.last4} ({m.expMonth}/{m.expYear}){m.isDefault ? ' (Default)' : ''}</p>)}
          <form className="login-form" onSubmit={async (e) => {
            e.preventDefault();
            const created = await createPaymentMethod({ ...paymentForm, isDefault: paymentMethods.length === 0 });
            setPaymentMethods((prev) => [created, ...prev]);
            setPaymentForm({ cardBrand: 'Visa', cardNumber: '', expMonth: 1, expYear: new Date().getFullYear() + 1 });
          }}>
            <label>Card brand<input value={paymentForm.cardBrand} onChange={(e) => setPaymentForm((p) => ({ ...p, cardBrand: e.target.value }))} /></label>
            <label>Card number<input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm((p) => ({ ...p, cardNumber: e.target.value }))} /></label>
            <div className="inline-fields">
              <label>Exp month<input type="number" value={paymentForm.expMonth} onChange={(e) => setPaymentForm((p) => ({ ...p, expMonth: Number(e.target.value) }))} /></label>
              <label>Exp year<input type="number" value={paymentForm.expYear} onChange={(e) => setPaymentForm((p) => ({ ...p, expYear: Number(e.target.value) }))} /></label>
            </div>
            <button className="btn btn-ghost" type="submit">Add payment method</button>
          </form>
        </article>
      </section>

      <section className="account-panel">
        <h3>Your Orders & Subscriptions</h3>
        {loading && <p className="state">Loading orders...</p>}
        {!loading && !orders.length && <p className="state">No orders yet.</p>}
        <div className="review-list">
          {orders.map((order) => (
            <div key={order.orderCode}>
              <p><strong>{order.orderCode}</strong> - {formatPrice(order.total)} - {order.status}{order.subscriptionFrequency ? ` - ${order.subscriptionFrequency}` : ''}</p>
              <div className="actions">
                <button className="btn btn-ghost" onClick={async () => {
                  const details = await fetchOrderDetails(order.orderCode);
                  setOrderDetails((prev) => ({ ...prev, [order.orderCode]: { items: details.items } }));
                }}>View details</button>
                <button className="btn btn-solid mini" onClick={async () => onReorder(await reorderOrder(order.orderCode))}>Reorder</button>
              </div>
              {orderDetails[order.orderCode]?.items?.map((item) => (
                <p key={`${order.orderCode}-${item.productId}`}>{item.name} x{item.quantity}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="account-panel">
        <h3>Support & Returns</h3>
        <p className="state">Need help? Submit an order issue or return request.</p>
        <form className="login-form" onSubmit={async (e) => {
          e.preventDefault();
          await createSupportTicket(supportForm);
          const next = await fetchSupportTickets();
          setTickets(next);
          setSupportForm({ orderCode: '', issueType: 'order_issue', message: '', returnRequested: false });
        }}>
          <label>Order code<input value={supportForm.orderCode} onChange={(e) => setSupportForm((p) => ({ ...p, orderCode: e.target.value }))} /></label>
          <label>Issue type<select value={supportForm.issueType} onChange={(e) => setSupportForm((p) => ({ ...p, issueType: e.target.value }))} className="checkout-input"><option value="order_issue">Order issue</option><option value="shipping_issue">Shipping issue</option><option value="product_issue">Product issue</option></select></label>
          <label>Message<input value={supportForm.message} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} /></label>
          <label><input type="checkbox" checked={supportForm.returnRequested} onChange={(e) => setSupportForm((p) => ({ ...p, returnRequested: e.target.checked }))} /> Request return/refund</label>
          <button className="btn btn-solid" type="submit">Submit ticket</button>
        </form>
        {tickets.map((t) => <p key={t.id}>#{t.id} {t.issueType} - {t.status} - Return: {t.returnStatus}{t.orderCode ? ` - ${t.orderCode}` : ''}</p>)}
      </section>

      <section className="account-panel">
        <h3>Privacy & Compliance</h3>
        <p className="state">Request an export of your data or ask for account-data deletion.</p>
        <div className="actions">
          <button className="btn btn-ghost" onClick={async () => await submitDataRequest('export')}>Request data export</button>
          <button className="btn btn-ghost" onClick={async () => await submitDataRequest('delete')}>Request data deletion</button>
        </div>
      </section>
    </main>
  );
}
