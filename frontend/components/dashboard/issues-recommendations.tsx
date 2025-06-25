import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define a more specific interface for the issues we're working with
interface Issue {
  id: string;
  severity: string;
  type: string;
  description: string;
  recommendation?: string;
  highlightedText?: string;
  page?: number;
}

interface IssuesRecommendationsProps {
  issues: Issue[];
}

export function IssuesRecommendations({ issues }: IssuesRecommendationsProps) {
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  
  // If there are no issues, show a message
  if (!issues || issues.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Issues & Recommendations</h3>
          <div className="text-center py-8 text-muted-foreground">
            No issues found in this report.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentIssue = issues[currentIssueIndex];
  
  const goToNextIssue = () => {
    setCurrentIssueIndex((prevIndex) => 
      prevIndex === issues.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPreviousIssue = () => {
    setCurrentIssueIndex((prevIndex) => 
      prevIndex === 0 ? issues.length - 1 : prevIndex - 1
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Issues & Recommendations</h3>
          <div className="text-sm text-muted-foreground">
            {currentIssueIndex + 1} of {issues.length}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge
                className={
                  currentIssue.severity === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : currentIssue.severity === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {currentIssue.severity}
              </Badge>
              <h4 className="font-medium mt-2">{currentIssue.type}</h4>
            </div>
          </div>
          
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-muted-foreground">{currentIssue.description}</p>
            {currentIssue.recommendation && (
              <div>
                <p className="font-medium mb-1">Recommendation:</p>
                <p className="text-muted-foreground">{currentIssue.recommendation}</p>
              </div>
            )}
            {currentIssue.highlightedText && (
              <div>
                <p className="font-medium mb-1">Highlighted Text:</p>
                <p className="text-muted-foreground italic bg-muted/50 p-2 rounded">{currentIssue.highlightedText}</p>
              </div>
            )}
            {currentIssue.page && (
              <div className="text-xs text-muted-foreground mt-2">
                Page {currentIssue.page}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousIssue}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextIssue}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 