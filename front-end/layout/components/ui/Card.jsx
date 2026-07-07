function Card({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded shadow relative hover:shadow-lg hover:-translate-y-1 transition duration-300">

      <h3 className="text-gray-500">{title}</h3>

      <p className="text-3xl font-bold mt-2">{value}</p>

      <span className={`absolute top-4 right-4 text-2xl ${color}`}>
        {icon}
      </span>

    </div>
  );
}

export default Card;