import { AdminOverview } from "./AdminOverview";

export const metadata = {
  title: "Admin Overview · Flunify",
  description: "Ringkasan sistem, aktivitas asesmen klinis, dan pengelolaan data Flunify.",
};

export default function AdminPage() {
  return <AdminOverview />;
}
