import { redirect } from "next/navigation";
import { fallbackLocale } from "@/lib/i18n";

export default function Home() {
  redirect(`/${fallbackLocale}`);
}
