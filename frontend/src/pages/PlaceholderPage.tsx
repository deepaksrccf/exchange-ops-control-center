import { Card } from "../components/ui/Card";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Exchange Operations Control Center</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <Card title="Phase 1 foundation">
        <p>
          The application shell and route are ready. Feature-specific API
          queries, tables, charts, and actions will be added in the next
          package.
        </p>
      </Card>
    </div>
  );
}
