// Dashboard.tsx
import { WaitingList } from './WaitingList';
import { CheckInQueue } from './CheckInQueue';

export function Dashboard({ 
  receptionistId, 
  doctors, 
  waitingRoomList, 
  todayAppointments,
  refreshData 
}: any) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left column: CheckInQueue (Quick Actions + Summary) */}
      <div className="lg:col-span-1">
        <CheckInQueue 
          receptionistId={receptionistId}
          doctors={doctors}
          waitingRoomList={waitingRoomList}  // Pass waitingRoomList here
          refreshData={refreshData}
        />
      </div>
      
      {/* Right column: Detailed Waiting List */}
      <div className="lg:col-span-2">
        <WaitingList 
          waitingRoomList={waitingRoomList}
          refreshData={refreshData}
        />
      </div>
    </div>
  );
}