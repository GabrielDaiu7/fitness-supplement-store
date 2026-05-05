import type { Product } from '../types';

type ProductModalProps = {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product) => void;
};

export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
        <img className="modal-image" src={product.image || '/images/default-product.svg'} alt={product.name} />
        <h3>{product.name}</h3>
        <p className="label">{product.category}</p>
        <p>{product.description}</p>
        <span className="price">${product.price.toFixed(2)}</span>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-solid" onClick={() => { onAdd(product); onClose(); }}>
            Add to Cart
          </button>
        </div>
      </section>
    </div>
  );
}
