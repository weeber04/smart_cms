// WaitingList.tsx - MODIFIED VERSION with 2-column grid and pagination
import { Users, Clock, User, Calendar, Phone, X, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface WaitingListProps {
  waitingRoomList: any[];
  refreshData: () => void;
}

export function WaitingList({ waitingRoomList, refreshData }: WaitingListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelVisitId, setCancelVisitId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const itemsPerPage = 4; // Display 4 items (2 per row)

  // Add search filter logic after the states:
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) {
      return waitingRoomList;
    }
    
    const query = searchQuery.toLowerCase();
    return waitingRoomList.filter(visit => 
      visit.patientName?.toLowerCase().includes(query) ||
      visit.QueueNumber?.toLowerCase().includes(query) ||
      visit.PhoneNumber?.includes(query)
    );
  }, [waitingRoomList, searchQuery]);
  
  // Use filteredVisits to calculate active and completed visits
  const activeVisits = filteredVisits.filter(visit => 
    (visit.QueueStatus && !['completed', 'cancelled'].includes(visit.QueueStatus)) ||
    (!visit.QueueStatus && visit.VisitStatus && !['completed', 'cancelled'].includes(visit.VisitStatus))
  );

  const completedVisits = filteredVisits.filter(visit => 
    (visit.QueueStatus && ['completed', 'cancelled'].includes(visit.QueueStatus)) ||
    (!visit.QueueStatus && visit.VisitStatus && ['completed', 'cancelled'].includes(visit.VisitStatus))
  );

  // Calculate pagination for active visits
  const activeTotalPages = Math.ceil(activeVisits.length / itemsPerPage);
  const activeStartIndex = (activePage - 1) * itemsPerPage;
  const activeEndIndex = activeStartIndex + itemsPerPage;
  const currentActiveVisits = activeVisits.slice(activeStartIndex, activeEndIndex);

  // Calculate pagination for completed visits
  const completedTotalPages = Math.ceil(completedVisits.length / itemsPerPage);
  const completedStartIndex = (completedPage - 1) * itemsPerPage;
  const completedEndIndex = completedStartIndex + itemsPerPage;
  const currentCompletedVisits = completedVisits.slice(completedStartIndex, completedEndIndex);

  const handleCancelVisit = async (visitId: number) => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch("http://localhost:3001/api/receptionist/cancel-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          visitId, 
          reason: cancelReason,
          cancelledBy: 'receptionist' 
        })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setCancelVisitId(null);
        setCancelReason('');
        refreshData();
        setActivePage(1); // Reset to first page after action
      } else {
        alert(result.error || 'Failed to cancel visit');
      }
    } catch (error) {
      console.error("Cancel visit error:", error);
      alert("Failed to cancel visit");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkAsNoShow = async (visitId: number) => {
    if (!confirm("Mark this patient as 'No Show'? This will remove them from the queue.")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/receptionist/mark-noshow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        refreshData();
        setActivePage(1); // Reset to first page after action
      } else {
        alert(result.error || 'Failed to mark as no show');
      }
    } catch (error) {
      console.error("No show error:", error);
      alert("Failed to mark as no show");
    }
  };

  const formatWaitTime = (arrivalTime: string) => {
    if (!arrivalTime) return 'Just arrived';
    
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just arrived';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (visit: any) => {
    const baseClasses = "text-xs font-medium";
    
    switch (visit.QueueStatus || visit.VisitStatus) {
      case 'waiting':
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-100`}>
            <Clock className="size-3 mr-1" />
            Waiting
          </Badge>
        );
      case 'in-progress':
      case 'in-consultation':
        return (
          <Badge className={`${baseClasses} bg-purple-100 text-purple-800 hover:bg-purple-100`}>
            <User className="size-3 mr-1" />
            In Consultation
          </Badge>
        );
      case 'checked-in':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100`}>
            <CheckCircle className="size-3 mr-1" />
            Checked In
          </Badge>
        );
      case 'completed':
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100`}>
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100`}>
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100`}>
            {visit.VisitStatus || 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Today's Waiting List</CardTitle>
                <CardDescription className="mt-1">
                  {activeVisits.length} patient(s) in queue • {completedVisits.length} completed/cancelled
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  refreshData();
                  setActivePage(1);
                  setCompletedPage(1);
                }}
                className="h-9"
              >
                ↻ Refresh
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder="Search by patient name, queue number, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActivePage(1);
                  setCompletedPage(1);
                }}
                className="pl-10 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActivePage(1);
                    setCompletedPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Active Queue */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Active Queue</h3>
                {searchQuery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Found {activeVisits.length} active patient(s) matching "{searchQuery}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  Next: {activeVisits[0]?.QueueNumber || 'None'}
                </span>
                {activeTotalPages > 1 && (
                  <span className="text-xs text-gray-500">
                    Page {activePage} of {activeTotalPages}
                  </span>
                )}
              </div>
            </div>
            
            {activeVisits.length === 0 && searchQuery && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                <Search className="size-12 mx-auto mb-3 text-gray-300" />
                <p>No active patients found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            )}
            
            {/* 2-column grid for active visits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentActiveVisits.map((visit) => (
                <div key={visit.VisitID} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">
                            {visit.QueueNumber?.split('-').pop() || 'N/A'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{visit.patientName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 flex-shrink-0" />
                              {formatWaitTime(visit.ArrivalTime || visit.CheckInTime)}
                            </span>
                            {visit.visitTypeLabel && (
                              <span className="bg-gray-100 px-2 py-0.5 rounded truncate">
                                {visit.visitTypeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {visit.ReasonForVisit && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{visit.ReasonForVisit}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                        {visit.doctorName && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded truncate max-w-[150px]">
                            <User className="size-3 flex-shrink-0" />
                            <span className="truncate">Dr. {visit.doctorName}</span>
                          </span>
                        )}
                        {visit.PhoneNumber && (
                          <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded truncate max-w-[130px]">
                            <Phone className="size-3 flex-shrink-0" />
                            <span className="truncate">{visit.PhoneNumber}</span>
                          </span>
                        )}
                        {visit.ArrivalTime && (
                          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <Calendar className="size-3 flex-shrink-0" />
                            {new Date(visit.ArrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-2">
                      {getStatusBadge(visit)}
                      <span className="text-xs text-gray-400">
                        #{visit.VisitID}
                      </span>
                    </div>
                  </div>
                  
                  {/* Receptionist Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {(visit.QueueStatus === 'waiting' || visit.VisitStatus === 'checked-in') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleMarkAsNoShow(visit.VisitID)}
                        >
                          No Show
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => setCancelVisitId(visit.VisitID)}
                        >
                          <X className="size-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    
                    {(visit.QueueStatus === 'in-progress' || visit.VisitStatus === 'in-consultation') && (
                      <div className="text-center w-full text-sm text-gray-500">
                        Patient with doctor
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {activeVisits.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                <Users className="size-12 mx-auto mb-3 text-gray-300" />
                <p>No patients in active queue</p>
                <p className="text-sm mt-2">Register walk-in patients to add to queue</p>
              </div>
            )}
            
            {/* Pagination for active visits */}
            {activeTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-700">
                  Showing {Math.min(activeVisits.length, activeStartIndex + 1)}-
                  {Math.min(activeVisits.length, activeEndIndex)} of {activeVisits.length} active patients
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                    disabled={activePage === 1}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm text-gray-700 min-w-[80px] text-center">
                    <span className="font-medium">{activePage}</span>
                    <span className="text-gray-400"> / {activeTotalPages}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActivePage(prev => Math.min(activeTotalPages, prev + 1))}
                    disabled={activePage === activeTotalPages}
                    className="h-8 px-3"
                  >
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Completed/Cancelled Section (Collapsible) */}
          {completedVisits.length > 0 && (
            <div className="border-t pt-6">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                  <span>Completed/Cancelled ({completedVisits.length})</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3">
                  {/* 2-column grid for completed visits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {currentCompletedVisits.map((visit) => (
                      <div key={visit.VisitID} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{visit.patientName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="truncate">{visit.QueueNumber}</span>
                              <span>•</span>
                              <span>{formatWaitTime(visit.ArrivalTime)}</span>
                              <span>•</span>
                              <span className="truncate">#{visit.VisitID}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(visit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination for completed visits */}
                  {completedTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        Showing {Math.min(completedVisits.length, completedStartIndex + 1)}-
                        {Math.min(completedVisits.length, completedEndIndex)} of {completedVisits.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCompletedPage(prev => Math.max(1, prev - 1))}
                          disabled={completedPage === 1}
                          className="h-8 px-3"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <div className="text-sm text-gray-700 min-w-[60px] text-center">
                          {completedPage} / {completedTotalPages}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCompletedPage(prev => Math.min(completedTotalPages, prev + 1))}
                          disabled={completedPage === completedTotalPages}
                          className="h-8 px-3"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Visit Dialog */}
      <Dialog open={cancelVisitId !== null} onOpenChange={(open) => !open && setCancelVisitId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Visit</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this visit. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g., Patient requested to reschedule, emergency, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelVisitId(null);
                setCancelReason('');
              }}
              disabled={isCancelling}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => cancelVisitId && handleCancelVisit(cancelVisitId)}
              disabled={!cancelReason.trim() || isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}