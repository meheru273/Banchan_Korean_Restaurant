const dietaryTags = (dietary = {}) => {
  const tags = [];
  if (dietary.isVegetarian) tags.push('Vegetarian');
  if (dietary.isVegan) tags.push('Vegan');
  if (dietary.isGlutenFree) tags.push('Gluten-free');
  if (dietary.isHalal) tags.push('Halal');
  return tags;
};

export default function MenuCard({ item, onAdd }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      {item.image ? (
        <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-[#1C1613]">{item.name}</h3>
          <span className="font-bold text-[#DC2113] whitespace-nowrap">£{item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1 flex-1">{item.description}</p>

        <div className="flex flex-wrap gap-1 mt-2">
          {dietaryTags(item.dietary).map((t) => (
            <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>

        <button
          onClick={() => onAdd(item)}
          disabled={!item.isAvailable}
          className="mt-3 bg-[#DC2113] text-white py-2 rounded disabled:opacity-50"
        >
          {item.isAvailable ? 'Add to cart' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
