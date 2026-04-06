import { Suspense } from "react";
import { ProjectView } from "@/components/features/project-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <ProjectView projectId={params.id} />
    </Suspense>
  );
}
