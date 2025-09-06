import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function PortfolioList() {
  const portfolios = useQuery(api.portfolios.listPortfolios);
  const createPortfolio = useMutation(api.portfolios.createPortfolio);
  const deletePortfolio = useMutation(api.portfolios.deletePortfolio);
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      await createPortfolio({ name: formData.name.trim() });
      setFormData({ name: "" });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: Id<"portfolios">) => {
    if (confirm("Are you sure you want to delete this portfolio?")) {
      await deletePortfolio({ portfolioId: id });
    }
  };

  if (portfolios === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Portfolios</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "New Portfolio"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <div>
            <label
              htmlFor="portfolio-name"
              className="block text-sm font-medium mb-1"
            >
              Portfolio Name
            </label>
            <input
              id="portfolio-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter portfolio name"
              enterKeyHint="done"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
          >
            Create Portfolio
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <div
            key={portfolio._id}
            className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => navigate(`/portfolio/${portfolio._id}`)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/portfolio/${portfolio._id}`);
              }
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{portfolio.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created{" "}
                  {new Date(portfolio._creationTime).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(portfolio._id);
                }}
                className="text-red-500 hover:text-red-700 text-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
