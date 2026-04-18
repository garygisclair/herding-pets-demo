import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <>
      <h1 className="mb-6 font-display text-4xl font-medium text-pets">Reports</h1>
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">
            Reports are coming soon — this demo focuses on pets + activity logging.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
