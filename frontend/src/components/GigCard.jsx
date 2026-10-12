export default function GigCard({ gig, canBook, onBook }) {
  return (
    <article className="gig-card">
      <h3>{gig.title}</h3>
      <p className="category">{gig.category}</p>
      <p>{gig.description}</p>
      <p className="price">R {Number(gig.price).toFixed(2)}</p>
      <small>by {gig.freelancer?.name}</small>
      {canBook && <button onClick={() => onBook(gig._id)}>Book</button>}
    </article>
  );
}
