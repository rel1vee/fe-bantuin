import PublicLayout from "@/components/layouts/PublicLayout";
import { Suspense } from "react";
import ConfirmOrderClient from "./ConfirmOrderClient";

export default function ConfirmOrderPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
          >
            <ConfirmOrderClient />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
