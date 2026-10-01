import type { Metadata } from "next";
import { getAdminReviewsAction } from "@/app/(admin)/actions/reviews";
import { ReviewsManagement } from "./_components/ReviewsManagement";

export const metadata: Metadata = { title: "Reviews | Admin Portal" };

export default async function AdminReviewsPage() {
  const res = await getAdminReviewsAction({ status: "pending" });
  return (
    <ReviewsManagement
      initial={res.success ? res.data : { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }}
      initialError={res.success ? null : res.error.message}
    />
  );
}
