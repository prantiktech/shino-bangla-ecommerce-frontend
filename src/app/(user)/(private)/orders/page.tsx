import { redirect } from "next/navigation";

export default function UserOrdersPage() {
  redirect("/account?tab=orders");
}
