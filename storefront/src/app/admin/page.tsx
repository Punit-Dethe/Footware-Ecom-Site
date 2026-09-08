import { redirect } from "next/navigation";

export default function RootAdminRedirect() {
  const spreeHost =
    process.env.NEXT_PUBLIC_SPREE_API_HOST ||
    process.env.SPREE_API_URL ||
    "https://mirza-spree-backend.onrender.com";
  redirect(`${spreeHost.replace(/\/$/, "")}/admin`);
}
