import { TrialGoLoader } from "@/components/ui/trialgo-loader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <TrialGoLoader size="md" label="Loading..." />
    </div>
  );
}
