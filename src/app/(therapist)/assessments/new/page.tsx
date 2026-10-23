import type { Metadata } from "next";
import { NewAssessmentView } from "./NewAssessmentView";

export const metadata: Metadata = {
  title: "Asesmen Baru",
  description: "Formulir dokumentasi asesmen kelancaran bicara, observasi ketidaklancaran, perekaman suara, dan kalkulasi %SS.",
};

export default function NewAssessmentPage() {
  return <NewAssessmentView />;
}
