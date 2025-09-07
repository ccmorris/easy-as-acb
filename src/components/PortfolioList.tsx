import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, X } from "lucide-react";
import {
  Button,
  Input,
  Card,
  InteractiveCard,
  AddNewCard,
  IconButton,
} from "./ui";

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
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Portfolios</h2>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="portfolio-name"
              label="Portfolio Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter portfolio name"
              enterKeyHint="done"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="success"
                size="sm"
                title="Create Portfolio"
              >
                <Plus className="w-4 h-4" />
                <span>Create Portfolio</span>
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="secondary"
                size="sm"
                title="Cancel"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <InteractiveCard
              key={portfolio._id}
              interactive
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
                  <h3 className="font-semibold text-lg text-text">
                    {portfolio.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Created{" "}
                    {
                      new Date(portfolio._creationTime)
                        .toISOString()
                        .split("T")[0]
                    }
                  </p>
                </div>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(portfolio._id);
                  }}
                  variant="danger"
                  size="md"
                  title="Delete Portfolio"
                >
                  <Trash2 className="w-5 h-5" />
                </IconButton>
              </div>
            </InteractiveCard>
          ))}

          {/* Create New Portfolio Card */}
          <AddNewCard
            onClick={() => setShowForm(!showForm)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowForm(!showForm);
              }
            }}
          >
            Create New Portfolio
          </AddNewCard>
        </div>
      )}
    </div>
  );
}
