import { AdminOverview } from "./AdminOverview";

export const metadata = {
  title: "Admin Overview · FluencyCare",
  description: "Ringkasan sistem, aktivitas asesmen klinis, dan pengelolaan data FluencyCare.",
};

export default function AdminPage() {
  return <AdminOverview />;
}
