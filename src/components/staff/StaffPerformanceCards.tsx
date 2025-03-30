
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StaffPerformanceData {
  id: string;
  userId: string;
  name: string;
  ticketsResolved: number;
  tasksCompleted: number;
  efficiency: number;
}

interface StaffPerformanceCardsProps {
  staffPerformance: StaffPerformanceData[];
  onSelectStaff: (staffId: string) => void;
}

const StaffPerformanceCards: React.FC<StaffPerformanceCardsProps> = ({
  staffPerformance,
  onSelectStaff
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {staffPerformance.map((staff) => (
        <Card 
          key={staff.id} 
          className="hover:bg-accent/20 transition-colors cursor-pointer" 
          onClick={() => onSelectStaff(staff.id)}
        >
          <CardContent className="pt-6">
            <div className="text-lg font-medium mb-2">{staff.name}</div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Tickets Resolved</p>
                <p className="text-xl font-bold">{staff.ticketsResolved}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-xl font-bold">{staff.tasksCompleted}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Efficiency Rating</p>
              <div className="flex items-center mt-1 gap-2">
                <Progress value={staff.efficiency} className="h-2" />
                <span className="text-sm font-medium">{staff.efficiency}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StaffPerformanceCards;
