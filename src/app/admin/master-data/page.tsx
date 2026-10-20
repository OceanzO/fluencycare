import { MasterDataManagement } from "./MasterDataManagement";

export const metadata = {
  title: "Master Data Klinis · FluencyCare",
  description: "Kelola checklist tugas bicara dan jenis ketidaklancaran bicara.",
};

export default function MasterDataPage() {
  return <MasterDataManagement />;
}
